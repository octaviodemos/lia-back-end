const { PrismaClient, TipoImagem } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'minhasenha';

  const existing = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin already exists:', adminEmail);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);
  const created = await prisma.usuario.create({
    data: {
      nome: 'Admin Seed',
      email: adminEmail,
      senha: hashed,
      tipo_usuario: 'admin',
    },
  });

  console.log('Created admin user:', created.email);
}

async function importBooks() {
  const fs = require('fs');
  const path = require('path');
  const dataPath = path.join(__dirname, 'books_br.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No books_br.json found, skipping book import');
    return;
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  const books = JSON.parse(raw);

  for (const b of books) {
    try {
      // skip if book with same ISBN exists
      if (b.isbn) {
        const existingBook = await prisma.livro.findFirst({ where: { isbn: b.isbn } });
        if (existingBook) {
          console.log(`Livro já existe (isbn): ${b.titulo} - ${b.isbn}`);
          // If there's a new capa_url in JSON and it's different, update it
          try {
            const newCover = b.capa_url || null;
            if (newCover) {
              const capaImg = await prisma.imagemLivro.findFirst({
                where: { id_livro: existingBook.id_livro, tipo_imagem: TipoImagem.Capa },
              });
              if (!capaImg || capaImg.url_imagem !== newCover) {
                if (capaImg) {
                  await prisma.imagemLivro.update({
                    where: { id_imagem_livro: capaImg.id_imagem_livro },
                    data: { url_imagem: newCover },
                  });
                } else {
                  await prisma.imagemLivro.create({
                    data: {
                      id_livro: existingBook.id_livro,
                      url_imagem: newCover,
                      tipo_imagem: TipoImagem.Capa,
                    },
                  });
                }
                console.log(`Atualizada imagem Capa para ${b.titulo}`);
              }
            }

            // ensure estoque exists for this livro; if none, create it
            const existingEstoque = await prisma.estoque.findFirst({ where: { id_livro: existingBook.id_livro } });
            if (!existingEstoque && b.estoque) {
              const precoDecimal = b.estoque.preco ? b.estoque.preco.toString() : '0.00';
              await prisma.estoque.create({
                data: {
                  id_livro: existingBook.id_livro,
                  preco: precoDecimal,
                  condicao: b.estoque.condicao || null,
                },
              });
              console.log(`Criado estoque para ${b.titulo}`);
            }
          } catch (uErr) {
            console.error('Erro ao atualizar livro existente', b.titulo, uErr.message || uErr);
          }
          continue;
        }
      }

      // create livro
      const createdLivro = await prisma.livro.create({
        data: {
          titulo: b.titulo,
          sinopse: b.sinopse || null,
          editora: b.editora || null,
          ano_publicacao: b.ano_publicacao || null,
          isbn: b.isbn || null,
          nota_conservacao: 5,
          descricao_conservacao: null,
          imagens: b.capa_url
            ? {
                create: [{ url_imagem: b.capa_url, tipo_imagem: TipoImagem.Capa }],
              }
            : undefined,
        },
      });

      // authors
      if (Array.isArray(b.autores)) {
        for (const authorName of b.autores) {
          let author = await prisma.autor.findFirst({ where: { nome_completo: authorName } });
          if (!author) {
            author = await prisma.autor.create({ data: { nome_completo: authorName } });
          }
          // link pivot
          await prisma.livroAutor.create({ data: { id_livro: createdLivro.id_livro, id_autor: author.id_autor } });
        }
      }

      // genres
      if (Array.isArray(b.generos)) {
        for (const generoName of b.generos) {
          // Genero.nome is unique in schema, so we can upsert via the name
          let genero = await prisma.genero.findUnique({ where: { nome: generoName } }).catch(() => null);
          if (!genero) {
            genero = await prisma.genero.create({ data: { nome: generoName } });
          }
          await prisma.livroGenero.create({ data: { id_livro: createdLivro.id_livro, id_genero: genero.id_genero } });
        }
      }

      // estoque
      if (b.estoque) {
        const precoDecimal = b.estoque.preco ? b.estoque.preco.toString() : '0.00';
        await prisma.estoque.create({
          data: {
            id_livro: createdLivro.id_livro,
            preco: precoDecimal,
            condicao: b.estoque.condicao || null,
          },
        });
      }

      console.log('Imported livro:', createdLivro.titulo);
    } catch (err) {
      console.error('Error importing book', b.titulo, err.message || err);
    }
  }
}

async function runAll() {
  try {
    await main();
    await importBooks();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAll();
