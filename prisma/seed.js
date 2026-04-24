const { PrismaClient, TipoImagem } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

function buildImagensCreateWithCapa(seedOffset, capaUrlPreferida) {
  const base = 10 + (Math.abs(Number(seedOffset)) % 900) * 5;
  const pick = (k) => Math.min(999, base + k);
  const capa =
    capaUrlPreferida && String(capaUrlPreferida).length > 0 && String(capaUrlPreferida).length <= 255
      ? String(capaUrlPreferida)
      : `https://picsum.photos/id/${pick(0)}/320/480`;
  return [
    { url_imagem: capa, tipo_imagem: TipoImagem.Capa },
    { url_imagem: `https://picsum.photos/id/${pick(1)}/320/480`, tipo_imagem: TipoImagem.Contracapa },
    { url_imagem: `https://picsum.photos/id/${pick(2)}/320/480`, tipo_imagem: TipoImagem.Lombada },
    { url_imagem: `https://picsum.photos/id/${pick(3)}/320/480`, tipo_imagem: TipoImagem.MioloPaginas },
    { url_imagem: `https://picsum.photos/id/${pick(4)}/320/480`, tipo_imagem: TipoImagem.DetalhesAvarias },
  ];
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'minhasenha';

  const hashed = await bcrypt.hash(adminPassword, 10);
  const result = await prisma.usuario.upsert({
    where: { email: adminEmail },
    create: {
      nome: 'Administrador',
      email: adminEmail,
      senha: hashed,
      tipo_usuario: 'admin',
    },
    update: {
      senha: hashed,
      tipo_usuario: 'admin',
    },
  });

  console.log('Admin pronto (criado ou atualizado):', result.email, result.tipo_usuario);
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

  for (let bi = 0; bi < books.length; bi++) {
    const b = books[bi];
    try {
      if (b.isbn) {
        const whereDup = { isbn: b.isbn };
        if (b.titulo) whereDup.titulo = b.titulo;
        const existingBook = await prisma.livro.findFirst({ where: whereDup });
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

      const createdLivro = await prisma.livro.create({
        data: {
          titulo: b.titulo,
          sinopse: b.sinopse || null,
          editora: b.editora || null,
          ano_publicacao: b.ano_publicacao || null,
          isbn: b.isbn || null,
          nota_conservacao: 5,
          descricao_conservacao: null,
          imagens: {
            create: buildImagensCreateWithCapa(3000 + bi, b.capa_url || null),
          },
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

const LIVROS_CATALOGO = [
  {
    titulo: 'Dom Casmurro',
    isbn: '9788572329583',
    editora: 'Saraiva',
    ano: 2012,
    sinopse: 'Bentinho e Capitu no Rio de Janeiro oitocentista — um clássico de Machado de Assis.',
    autores: ['Machado de Assis'],
    generos: ['Romance', 'Literatura Brasileira'],
    nota: 5,
    destaque: true,
    preco: '32.90',
    capa: 'https://covers.openlibrary.org/b/isbn/9788572329583-M.jpg',
  },
  {
    titulo: 'Grande sertão: veredas',
    isbn: '9788572326137',
    editora: 'Nova Fronteira',
    ano: 2010,
    sinopse: 'A saga de Riobaldo e Diadorim no sertão mineiro, obra-prima de Guimarães Rosa.',
    autores: ['João Guimarães Rosa'],
    generos: ['Romance', 'Regionalismo'],
    nota: 4,
    destaque: false,
    preco: '45.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9788572326137-M.jpg',
  },
  {
    titulo: 'Ficciones',
    isbn: '9780060929756',
    editora: 'Harper Perennial',
    ano: 2000,
    sinopse: 'Contos e labirintos: Tlön, Funes e outras invenções de Borges.',
    autores: ['Jorge Luis Borges'],
    generos: ['Contos', 'Ficção'],
    nota: 5,
    destaque: true,
    preco: '58.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780060929756-M.jpg',
  },
  {
    titulo: 'Duna',
    isbn: '9780441172719',
    editora: 'Ace Books',
    ano: 2014,
    sinopse: 'O planeta desértico Arrakis e a especiaria que move impérios.',
    autores: ['Frank Herbert'],
    generos: ['Ficção científica', 'Fantasia'],
    nota: 4,
    destaque: false,
    preco: '64.90',
    capa: 'https://covers.openlibrary.org/b/isbn/9780441172719-M.jpg',
  },
  {
    titulo: 'Cem anos de solidão',
    isbn: '9781400034710',
    editora: 'Everyman',
    ano: 2002,
    sinopse: 'A família Buendía e Macondo, narrativa fundamental de García Márquez.',
    autores: ['Gabriel García Márquez'],
    generos: ['Realismo fantástico', 'Romance'],
    nota: 5,
    destaque: false,
    preco: '39.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9781400034710-M.jpg',
  },
  {
    titulo: 'O processo',
    isbn: '9780805209990',
    editora: 'Schocken',
    ano: 1998,
    sinopse: 'Josef K. e a maquinaria da justiça em Kafka.',
    autores: ['Franz Kafka'],
    generos: ['Ficção', 'Clássico'],
    nota: 3,
    destaque: false,
    preco: '28.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780805209990-M.jpg',
  },
  {
    titulo: 'A metamorfose',
    isbn: '9780553213690',
    editora: 'Bantam',
    ano: 2004,
    sinopse: 'Gregor Samsa desperta transformado — a história do alienamento.',
    autores: ['Franz Kafka'],
    generos: ['Conto', 'Clássico'],
    nota: 4,
    destaque: false,
    preco: '19.50',
    capa: 'https://covers.openlibrary.org/b/isbn/9780553213690-M.jpg',
  },
  {
    titulo: 'Fahrenheit 451',
    isbn: '9781451673319',
    editora: 'Simon and Schuster',
    ano: 2012,
    sinopse: 'Os bombeiros queimam livros; uma distopia sobre o pensamento e a memória.',
    autores: ['Ray Bradbury'],
    generos: ['Ficção científica', 'Distopia'],
    nota: 4,
    destaque: false,
    preco: '24.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9781451673319-M.jpg',
  },
  {
    titulo: 'Morte na Mesopotâmia',
    isbn: '9780062074746',
    editora: 'Harper',
    ano: 2010,
    sinopse: 'Hercule Poirot e um enigma arqueológico e familiar.',
    autores: ['Agatha Christie'],
    generos: ['Policial', 'Mistério'],
    nota: 3,
    destaque: false,
    preco: '36.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780062074746-M.jpg',
  },
  {
    titulo: 'A cor que caiu do céu',
    isbn: '9781840226238',
    editora: 'Wordsworth',
    ano: 2013,
    sinopse: 'Cósmico horror: meteorito, vaca misteriosa e a decadência de Arkham.',
    autores: ['H. P. Lovecraft'],
    generos: ['Terror', 'Ficção científica'],
    nota: 2,
    destaque: false,
    preco: '18.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9781840226238-M.jpg',
  },
  {
    titulo: 'A arte da guerra',
    isbn: '9788544000424',
    editora: 'Clássicos',
    ano: 2015,
    sinopse: 'Estratégia, liderança e tática — texto milenar da China.',
    autores: ['Sun Tzu'],
    generos: ['Não-ficção', 'História'],
    nota: 4,
    destaque: false,
    preco: '22.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9788544000424-M.jpg',
  },
  {
    titulo: 'Sapiens',
    isbn: '9780062316110',
    editora: 'Harper',
    ano: 2018,
    sinopse: 'Breve história da humanidade: animais a deuses.',
    autores: ['Yuval Noah Harari'],
    generos: ['História', 'Antropologia'],
    nota: 5,
    destaque: true,
    preco: '49.90',
    capa: 'https://covers.openlibrary.org/b/isbn/9780062316110-M.jpg',
  },
  {
    titulo: 'A revolução dos bichos',
    isbn: '9780141036137',
    editora: 'Penguin',
    ano: 2003,
    sinopse: 'A fazenda onde os porcos lideram a revolta — alegoria política de Orwell.',
    autores: ['George Orwell'],
    generos: ['Sátira', 'Fábula'],
    nota: 4,
    destaque: false,
    preco: '19.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780141036137-M.jpg',
  },
  {
    titulo: 'O homem do castelo alto',
    isbn: '9780241956196',
    editora: 'Penguin',
    ano: 2011,
    sinopse: 'E se o Eixo tivesse vencido? Distopia e identidade em PKD.',
    autores: ['Philip K. Dick'],
    generos: ['Ficção científica', 'Distopia'],
    nota: 3,
    destaque: false,
    preco: '27.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780241956196-M.jpg',
  },
  {
    titulo: 'A culpa é das estrelas',
    isbn: '9780141345659',
    editora: 'Penguin',
    ano: 2012,
    sinopse: 'Hazel e Augustus, amor, perda e literatura.',
    autores: ['John Green'],
    generos: ['Jovem adulto', 'Romance'],
    nota: 4,
    destaque: false,
    preco: '30.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780141345659-M.jpg',
  },
  {
    titulo: 'A garota no trem',
    isbn: '9781101990264',
    editora: 'Riverhead',
    ano: 2015,
    sinopse: 'Thriller psicológico e rotina de trem suburbano.',
    autores: ['Paula Hawkins'],
    generos: ['Thriller', 'Mistério'],
    nota: 3,
    destaque: false,
    preco: '29.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9781101990264-M.jpg',
  },
  {
    titulo: 'A culpa do IBGE',
    isbn: '9780000000001',
    editora: 'Dados',
    ano: 2020,
    sinopse: 'Livro fictício de exemplo de seed: humor sobre estatísticas (placeholder).',
    autores: ['Autor Fictício'],
    generos: ['Humor', 'Não-ficção'],
    nota: 1,
    destaque: false,
    preco: '9.90',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000001-M.jpg',
  },
  {
    titulo: 'Cálculo 1: limites e derivadas',
    isbn: '9780000000002',
    editora: 'Edu',
    ano: 2018,
    sinopse: 'Livro didático de exemplo: introdução a limites, continuidade e derivada.',
    autores: ['Prof. Exemplar', 'Mentora Técnica'],
    generos: ['Educação', 'Matemática'],
    nota: 4,
    destaque: false,
    preco: '99.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000002-M.jpg',
  },
  {
    titulo: 'Cozinha do sertão',
    isbn: '9780000000003',
    editora: 'Cultural',
    ano: 2016,
    sinopse: 'Receitas, histórias e ingredientes de uma região inventada de seed.',
    autores: ['Cozinheiro Regional'],
    generos: ['Gastronomia', 'Cultura'],
    nota: 5,
    destaque: false,
    preco: '55.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000003-M.jpg',
  },
  {
    titulo: 'A ordem e o jardim',
    isbn: '9780000000004',
    editora: 'Verde',
    ano: 2014,
    sinopse: 'Ficção botânica leve: um jardim, uma conspiração de camélias (seed).',
    autores: ['B. Folha'],
    generos: ['Contos', 'Ficção'],
    nota: 2,
    destaque: false,
    preco: '11.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000004-M.jpg',
  },
  {
    titulo: 'Cidades invisíveis reimaginadas',
    isbn: '9780000000005',
    editora: 'Orbital',
    ano: 2021,
    sinopse: 'Homenagem conceitual a cidades, mapas e viagens lícitas de seed.',
    autores: ['C. Cidade'],
    generos: ['Viagem', 'Ensaio'],
    nota: 4,
    destaque: false,
    preco: '40.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000005-M.jpg',
  },
  {
    titulo: 'Banco de Dados: modelagem',
    isbn: '9780000000006',
    editora: 'Tech',
    ano: 2022,
    sinopse: 'Normalização, MER e SQL — exemplar didático (seed, não reutilizar título comercial).',
    autores: ['D. Dados'],
    generos: ['Tecnologia', 'Educação'],
    nota: 3,
    destaque: true,
    preco: '120.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000006-M.jpg',
  },
  {
    titulo: 'Memórias de quem fica em casa',
    isbn: '9780000000007',
    editora: 'Diário',
    ano: 2019,
    sinopse: 'Crônicas pessoais inventadas, diversidade de vozes (dados de seed).',
    autores: ['Ana Rotina', 'Beto Sábado'],
    generos: ['Crônica', 'Contemporânea'],
    nota: 3,
    destaque: false,
    preco: '16.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9780000000007-M.jpg',
  },
];

const LIVROS_MESMO_ISBN = [
  {
    titulo: 'Manual da Vitrine LIA (Edição premium)',
    isbn: '9789012345678',
    editora: 'LIA Seed',
    ano: 2025,
    sinopse:
      'Mesmo ISBN que os outros dois exemplares — este tem destaque na vitrine e deve ser o representante na listagem.',
    autores: ['Curadoria LIA'],
    generos: ['Demonstração'],
    nota: 5,
    destaque: true,
    preco: '89.90',
    capa: 'https://covers.openlibrary.org/b/isbn/9788572329583-M.jpg',
  },
  {
    titulo: 'Manual da Vitrine LIA (Brochura)',
    isbn: '9789012345678',
    editora: 'LIA Seed',
    ano: 2025,
    sinopse: 'Mesmo ISBN: opção mais barata na ficha do livro em “outras opções”.',
    autores: ['Curadoria LIA'],
    generos: ['Demonstração'],
    nota: 4,
    destaque: false,
    preco: '52.00',
    capa: 'https://covers.openlibrary.org/b/isbn/9788572326137-M.jpg',
  },
  {
    titulo: 'Manual da Vitrine LIA (Seminovo)',
    isbn: '9789012345678',
    editora: 'LIA Seed',
    ano: 2025,
    sinopse: 'Mesmo ISBN: terceiro exemplar para testar agrupamento por ISBN na loja.',
    autores: ['Curadoria LIA'],
    generos: ['Demonstração'],
    nota: 4,
    destaque: false,
    preco: '34.90',
    capa: 'https://covers.openlibrary.org/b/isbn/9780060929756-M.jpg',
  },
];

async function seedUsuariosClientes() {
  const defPass = process.env.SEED_USER_PASSWORD || 'minhasenha';
  const hashed = await bcrypt.hash(defPass, 10);
  const pessoas = [
    { nome: 'Clara Menezes', email: 'clara@example.com', telefone: '(11) 98811-0001' },
    { nome: 'Roberto Içara', email: 'roberto.icara@example.com', telefone: '(48) 99922-2002' },
    { nome: 'Marina Sul', email: 'marina.sul@example.com', telefone: null },
    { nome: 'Pedro Cartões', email: 'pedro.cart@example.com', telefone: '(21) 97733-3003' },
  ];
  for (const p of pessoas) {
    const exist = await prisma.usuario.findUnique({ where: { email: p.email } });
    if (exist) continue;
    await prisma.usuario.create({
      data: {
        nome: p.nome,
        email: p.email,
        telefone: p.telefone,
        senha: hashed,
        tipo_usuario: 'cliente',
      },
    });
    console.log('Usuário cliente de seed:', p.email);
  }
}

async function criarLivroCatalogo(b, seedIdx) {
  const created = await prisma.livro.create({
    data: {
      titulo: b.titulo,
      sinopse: b.sinopse,
      editora: b.editora,
      ano_publicacao: b.ano,
      isbn: b.isbn,
      nota_conservacao: b.nota,
      descricao_conservacao: null,
      destaque_vitrine: !!b.destaque,
      imagens: {
        create: buildImagensCreateWithCapa(seedIdx, b.capa || null),
      },
    },
  });
  for (const an of b.autores || []) {
    let a = await prisma.autor.findFirst({ where: { nome_completo: an } });
    if (!a) a = await prisma.autor.create({ data: { nome_completo: an } });
    await prisma.livroAutor.create({
      data: { id_livro: created.id_livro, id_autor: a.id_autor },
    });
  }
  for (const g of b.generos || []) {
    let gr = await prisma.genero.findUnique({ where: { nome: g } });
    if (!gr) gr = await prisma.genero.create({ data: { nome: g } });
    await prisma.livroGenero.create({
      data: { id_livro: created.id_livro, id_genero: gr.id_genero },
    });
  }
  await prisma.estoque.create({
    data: {
      id_livro: created.id_livro,
      preco: b.preco,
      condicao: null,
      disponivel: true,
    },
  });
  return created;
}

async function seedLivrosCatalogo() {
  let seedIdx = 0;
  for (const b of LIVROS_CATALOGO) {
    try {
      if (!b.isbn) continue;
      const dup = await prisma.livro.findFirst({
        where: { isbn: b.isbn, titulo: b.titulo },
      });
      if (dup) continue;
      seedIdx += 1;
      await criarLivroCatalogo(b, seedIdx);
      console.log('Catálogo seed: livro criado —', b.titulo);
    } catch (e) {
      console.error('Catálogo seed falhou', b.titulo, e.message || e);
    }
  }
}

async function seedLivrosMesmoIsbn() {
  let seedIdx = 100;
  for (const b of LIVROS_MESMO_ISBN) {
    try {
      if (!b.isbn) continue;
      const dup = await prisma.livro.findFirst({
        where: { isbn: b.isbn, titulo: b.titulo },
      });
      if (dup) continue;
      seedIdx += 1;
      await criarLivroCatalogo(b, seedIdx);
      console.log('Seed mesmo ISBN: livro criado —', b.titulo);
    } catch (e) {
      console.error('Seed mesmo ISBN falhou', b.titulo, e.message || e);
    }
  }
}

async function runAll() {
  try {
    await main();
    await seedUsuariosClientes();
    await seedLivrosCatalogo();
    await seedLivrosMesmoIsbn();
    await importBooks();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAll();
