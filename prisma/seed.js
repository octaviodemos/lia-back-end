const { PrismaClient, TipoImagem } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

// ──── Open Library cover helper (sem rate-limit, sem API key) ────
function openLibraryCover(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

function buildImagensCreateWithCapa(seedOffset, capaUrlPreferida) {
  const capa =
    capaUrlPreferida && String(capaUrlPreferida).length > 0 && String(capaUrlPreferida).length <= 255
      ? String(capaUrlPreferida)
      : null;
  if (!capa) return [];
  return [
    { url_imagem: capa, tipo_imagem: TipoImagem.Capa },
  ];
}

function variantesQuatroExemplares(precoReferencia) {
  const base = parseFloat(String(precoReferencia).replace(',', '.'));
  const b0 = Number.isFinite(base) && base > 0 ? base : 19.9;
  const p = (delta) => {
    const v = Math.round((b0 + delta) * 100) / 100;
    return (v < 5 ? 5 : v).toFixed(2);
  };
  return [
    { nota: 5, destaque: true, preco: p(0) },
    { nota: 4, destaque: false, preco: p(-2) },
    { nota: 2, destaque: false, preco: p(-5) },
    { nota: 4, destaque: false, preco: p(-7) },
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
    capa: 'https://covers.openlibrary.org/b/id/647501-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/13909068-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/10832290-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/11481354-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/12627383-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/997423-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/12820198-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/12993656-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/12855104-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/4920850-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/4849549-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/8634250-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/11261770-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/420452-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/7418786-M.jpg',
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
    capa: 'https://covers.openlibrary.org/b/id/13523038-M.jpg',
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
  for (const grupo of LIVROS_CATALOGO) {
    try {
      if (!grupo.isbn) continue;
      const variantes = variantesQuatroExemplares(grupo.preco);
      for (const ex of variantes) {
        const titulo = grupo.titulo;
        const dup = await prisma.livro.findFirst({
          where: {
            isbn: grupo.isbn,
            titulo,
            nota_conservacao: ex.nota,
            estoque: { some: { preco: ex.preco } },
          },
        });
        if (dup) {
          try {
            const newCover = grupo.capa || null;
            if (newCover) {
              const capaImg = await prisma.imagemLivro.findFirst({
                where: { id_livro: dup.id_livro, tipo_imagem: 'Capa' },
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
                      id_livro: dup.id_livro,
                      url_imagem: newCover,
                      tipo_imagem: 'Capa',
                    },
                  });
                }
                console.log(`Atualizada imagem Capa para ${titulo} -> ${newCover}`);
              }
            }
          } catch (uErr) {
            console.error('Erro ao atualizar capa para livro existente', titulo, uErr.message || uErr);
          }
          continue;
        }
        seedIdx += 1;
        const b = {
          ...grupo,
          titulo,
          nota: ex.nota,
          destaque: ex.destaque,
          preco: ex.preco,
        };
        await criarLivroCatalogo(b, seedIdx);
        console.log('Catálogo seed: livro criado —', titulo, String(ex.preco));
      }
    } catch (e) {
      console.error('Catálogo seed falhou', grupo.titulo, e.message || e);
    }
  }
}

// ──── Catálogo extra com capas reais via Open Library ────
const LIVROS_OPEN_LIBRARY = [
  // ── Literatura Brasileira & Lusófona ──
  { isbn: '9788535914849', titulo: 'O Alquimista', autores: ['Paulo Coelho'], generos: ['Romance', 'Aventura'], editora: 'Rocco', ano: 1988, sinopse: 'Um jovem pastor espanhol empreende uma jornada épica em busca de um tesouro escondido nas Pirâmides do Egito.', preco: '34.90', destaque: true },
  // ── Ficção Científica & Fantasia ──
  { isbn: '9780547928227', titulo: 'The Hobbit', autores: ['J.R.R. Tolkien'], generos: ['Fantasia', 'Aventura'], editora: 'Mariner Books', ano: 1937, sinopse: 'Bilbo Bolseiro parte em uma aventura inesperada com treze anões para reconquistar o tesouro guardado pelo dragão Smaug.', preco: '54.90', destaque: true },
  { isbn: '9780439023481', titulo: 'The Hunger Games', autores: ['Suzanne Collins'], generos: ['Ficção científica', 'Jovem adulto'], editora: 'Scholastic', ano: 2008, sinopse: 'Em um futuro distópico, Katniss Everdeen luta pela sobrevivência em um jogo televisionado mortal.', preco: '39.90', destaque: true },
  { isbn: '9780060850524', titulo: 'Brave New World', autores: ['Aldous Huxley'], generos: ['Ficção científica', 'Distopia'], editora: 'Harper Perennial', ano: 1932, sinopse: 'Uma sociedade futurista controlada pelo prazer, engenharia genética e conformidade social.', preco: '29.00' },
  { isbn: '9780385490818', titulo: 'The Handmaid\'s Tale', autores: ['Margaret Atwood'], generos: ['Ficção científica', 'Distopia'], editora: 'Anchor', ano: 1985, sinopse: 'Em Gilead, uma teocracia totalitária, as mulheres perderam todos os direitos e são forçadas à servidão reprodutiva.', preco: '38.00' },
  { isbn: '9780593135204', titulo: 'Project Hail Mary', autores: ['Andy Weir'], generos: ['Ficção científica', 'Aventura'], editora: 'Ballantine', ano: 2021, sinopse: 'Um astronauta solitário acorda sem memória em uma nave espacial com a missão de salvar a Terra.', preco: '52.00', destaque: true },
  // ── Suspense & Terror ──
  { isbn: '9780307387899', titulo: 'O Iluminado', autores: ['Stephen King'], generos: ['Terror', 'Suspense'], editora: 'Anchor', ano: 1977, sinopse: 'Jack Torrance aceita o cargo de zelador de inverno no Hotel Overlook, onde forças sobrenaturais ameaçam sua família.', preco: '45.00' },
  { isbn: '9780385333481', titulo: 'O Caçador de Pipas', autores: ['Khaled Hosseini'], generos: ['Romance', 'Drama'], editora: 'Riverhead', ano: 2003, sinopse: 'A história de amizade e redenção entre dois meninos no Afeganistão dilacerado pela guerra.', preco: '39.90' },
  { isbn: '9780307474278', titulo: 'A Estrada', autores: ['Cormac McCarthy'], generos: ['Ficção', 'Pós-apocalíptico'], editora: 'Vintage', ano: 2006, sinopse: 'Um pai e seu filho caminham por uma América devastada, tentando sobreviver em um mundo sem esperança.', preco: '35.00' },
  // ── Clássicos internacionais ──
  { isbn: '9780679783268', titulo: 'Pride and Prejudice', autores: ['Jane Austen'], generos: ['Romance', 'Clássico'], editora: 'Modern Library', ano: 1813, sinopse: 'Elizabeth Bennet e o orgulhoso Mr. Darcy superam preconceitos e diferenças sociais em busca do amor verdadeiro.', preco: '25.00' },
  { isbn: '9780140449136', titulo: 'Crime and Punishment', autores: ['Fyodor Dostoevsky'], generos: ['Romance', 'Clássico'], editora: 'Penguin', ano: 1866, sinopse: 'Raskólnikov comete um assassinato e enfrenta o tormento psicológico da culpa e da redenção.', preco: '28.00' },
  { isbn: '9780679720201', titulo: 'The Stranger', autores: ['Albert Camus'], generos: ['Ficção', 'Filosofia'], editora: 'Vintage', ano: 1942, sinopse: 'Meursault, um homem indiferente ao mundo, comete um crime e enfrenta o absurdo da existência.', preco: '26.00' },
  { isbn: '9780316769488', titulo: 'The Catcher in the Rye', autores: ['J.D. Salinger'], generos: ['Romance', 'Jovem adulto'], editora: 'Little, Brown', ano: 1951, sinopse: 'Holden Caulfield vaga por Nova York questionando a hipocrisia do mundo adulto.', preco: '30.00' },
  // ── Não-ficção ──
  { isbn: '9780735211292', titulo: 'Atomic Habits', autores: ['James Clear'], generos: ['Não-ficção', 'Autoajuda'], editora: 'Avery', ano: 2018, sinopse: 'Um guia prático para construir bons hábitos e eliminar os ruins usando pequenas mudanças diárias.', preco: '48.90', destaque: true },
  { isbn: '9780525559474', titulo: 'Becoming', autores: ['Michelle Obama'], generos: ['Biografia', 'Não-ficção'], editora: 'Crown', ano: 2018, sinopse: 'A autobiografia da ex-primeira-dama dos EUA, da infância em Chicago à Casa Branca.', preco: '55.00' },
  // ── Harry Potter ──
  { isbn: '9780439064873', titulo: 'Harry Potter and the Chamber of Secrets', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Scholastic', ano: 1999, sinopse: 'Harry retorna a Hogwarts e descobre que uma câmara secreta foi aberta, libertando um monstro antigo.', preco: '35.00' },
  { isbn: '9780439139595', titulo: 'Harry Potter and the Prisoner of Azkaban', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Scholastic', ano: 1999, sinopse: 'Sirius Black escapa de Azkaban e Harry descobre verdades sobre o passado de seus pais.', preco: '35.00' },
  { isbn: '9780545010221', titulo: 'Harry Potter and the Deathly Hallows', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Scholastic', ano: 2007, sinopse: 'Harry, Ron e Hermione partem em busca das Horcruxes para derrotar Voldemort de uma vez por todas.', preco: '42.00' },
  // ── Romance contemporâneo ──
  { isbn: '9780062024039', titulo: 'Divergent', autores: ['Veronica Roth'], generos: ['Ficção científica', 'Jovem adulto'], editora: 'Katherine Tegen', ano: 2011, sinopse: 'Tris Prior descobre que é Divergente numa sociedade dividida em cinco facções com regras rígidas.', preco: '33.00' },
  { isbn: '9780143105428', titulo: 'The Goldfinch', autores: ['Donna Tartt'], generos: ['Romance', 'Drama'], editora: 'Back Bay', ano: 2013, sinopse: 'Após um atentado no Metropolitan Museum, o jovem Theo Decker carrega consigo uma pintura que mudará sua vida.', preco: '47.00' },
  // ── Mais Literatura Brasileira ──
  // ── Mais Fantasia & Ficção Científica ──
  { isbn: '9780618640157', titulo: 'The Lord of the Rings', autores: ['J.R.R. Tolkien'], generos: ['Fantasia', 'Aventura'], editora: 'Houghton Mifflin', ano: 1954, sinopse: 'A jornada épica de Frodo para destruir o Um Anel nas fendas da Montanha da Perdição.', preco: '79.90', destaque: true },
  { isbn: '9780451457998', titulo: 'The Eye of the World', autores: ['Robert Jordan'], generos: ['Fantasia', 'Épico'], editora: 'Tor', ano: 1990, sinopse: 'Rand al\'Thor e seus amigos fogem de sua aldeia perseguidos por criaturas sombrias, iniciando uma jornada épica.', preco: '45.00' },
  { isbn: '9780441569595', titulo: 'Neuromancer', autores: ['William Gibson'], generos: ['Ficção científica', 'Cyberpunk'], editora: 'Ace', ano: 1984, sinopse: 'Um hacker decadente é contratado para o maior golpe cibernético da história no ciberespaço.', preco: '36.00' },
  { isbn: '9780553382563', titulo: 'A Game of Thrones', autores: ['George R.R. Martin'], generos: ['Fantasia', 'Épico'], editora: 'Bantam', ano: 1996, sinopse: 'Famílias nobres disputam o Trono de Ferro enquanto uma ameaça antiga desperta além da Muralha.', preco: '49.90', destaque: true },
  { isbn: '9780062561022', titulo: 'The Name of the Wind', autores: ['Patrick Rothfuss'], generos: ['Fantasia', 'Aventura'], editora: 'DAW', ano: 2007, sinopse: 'Kvothe, lendário mago e aventureiro, narra sua história desde a infância até se tornar o homem mais procurado do mundo.', preco: '42.00' },
  // ── Mais Terror & Suspense ──
  { isbn: '9781501142970', titulo: 'It', autores: ['Stephen King'], generos: ['Terror', 'Suspense'], editora: 'Scribner', ano: 1986, sinopse: 'Sete crianças enfrentam uma entidade maligna que se alimenta do medo e assume a forma de um palhaço em Derry, Maine.', preco: '55.00', destaque: true },
  { isbn: '9780307743657', titulo: 'Gone Girl', autores: ['Gillian Flynn'], generos: ['Thriller', 'Mistério'], editora: 'Crown', ano: 2012, sinopse: 'No dia do quinto aniversário de casamento, Amy desaparece e Nick se torna o principal suspeito.', preco: '38.00' },
  { isbn: '9780525478812', titulo: 'The Girl with the Dragon Tattoo', autores: ['Stieg Larsson'], generos: ['Thriller', 'Mistério'], editora: 'Knopf', ano: 2005, sinopse: 'Um jornalista e uma hacker investigam o desaparecimento de uma mulher de uma rica família sueca há 40 anos.', preco: '41.00' },
  // ── Mais Clássicos ──
  { isbn: '9780142437247', titulo: 'Great Expectations', autores: ['Charles Dickens'], generos: ['Romance', 'Clássico'], editora: 'Penguin', ano: 1861, sinopse: 'O órfão Pip recebe uma herança misteriosa e parte para Londres em busca de ascensão social e amor.', preco: '24.00' },
  { isbn: '9780486284736', titulo: 'Frankenstein', autores: ['Mary Shelley'], generos: ['Terror', 'Clássico'], editora: 'Dover', ano: 1818, sinopse: 'Victor Frankenstein cria um ser a partir de partes de cadáveres e enfrenta as consequências de brincar de Deus.', preco: '18.00' },
  { isbn: '9780141439518', titulo: 'Dracula', autores: ['Bram Stoker'], generos: ['Terror', 'Clássico'], editora: 'Penguin', ano: 1897, sinopse: 'O Conde Drácula viaja da Transilvânia à Inglaterra em busca de novas vítimas para saciar sua sede de sangue.', preco: '22.00' },
  { isbn: '9780060934347', titulo: 'Don Quixote', autores: ['Miguel de Cervantes'], generos: ['Romance', 'Clássico'], editora: 'Ecco', ano: 1605, sinopse: 'Um fidalgo enlouquecido pela leitura de romances de cavalaria sai pelo mundo para desfazer agravos e endireitar injustiças.', preco: '35.00' },
  // ── Ciência & Filosofia ──
  { isbn: '9780553380163', titulo: 'A Brief History of Time', autores: ['Stephen Hawking'], generos: ['Ciência', 'Não-ficção'], editora: 'Bantam', ano: 1988, sinopse: 'Uma viagem pela cosmologia moderna: buracos negros, Big Bang e a natureza do tempo.', preco: '39.90' },
  { isbn: '9780393356250', titulo: 'Astrophysics for People in a Hurry', autores: ['Neil deGrasse Tyson'], generos: ['Ciência', 'Não-ficção'], editora: 'Norton', ano: 2017, sinopse: 'Uma introdução acessível e divertida aos grandes mistérios do universo.', preco: '32.00' },
  // ── Infantojuvenil & Young Adult ──
  { isbn: '9780064471046', titulo: 'Charlotte\'s Web', autores: ['E.B. White'], generos: ['Infantojuvenil', 'Fábula'], editora: 'HarperCollins', ano: 1952, sinopse: 'A aranha Charlotte usa suas teias para salvar seu amigo, o porquinho Wilbur, do abatedouro.', preco: '22.00' },
  { isbn: '9780439554930', titulo: 'Harry Potter and the Philosopher\'s Stone', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Scholastic', ano: 1997, sinopse: 'Harry descobre que é um bruxo e inicia sua jornada mágica em Hogwarts.', preco: '34.90', destaque: true },
  { isbn: '9780142410318', titulo: 'Percy Jackson and the Lightning Thief', autores: ['Rick Riordan'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Disney Hyperion', ano: 2005, sinopse: 'Percy descobre que é filho de Poseidon e embarca numa missão para evitar uma guerra entre os deuses do Olimpo.', preco: '33.00' },
  // ── Romance & Drama Moderno ──
  { isbn: '9780735219106', titulo: 'Where the Crawdads Sing', autores: ['Delia Owens'], generos: ['Romance', 'Mistério'], editora: 'Putnam', ano: 2018, sinopse: 'Kya Clark, a "Garota do Brejo", cresce sozinha nos pântanos da Carolina do Norte e se torna suspeita de assassinato.', preco: '44.00', destaque: true },
  { isbn: '9780670026197', titulo: 'The Fault in Our Stars', autores: ['John Green'], generos: ['Romance', 'Jovem adulto'], editora: 'Dutton', ano: 2012, sinopse: 'Hazel e Augustus, dois adolescentes com câncer, vivem uma história de amor que desafia a brevidade da vida.', preco: '30.00' },
  { isbn: '9780385737951', titulo: 'Wonder', autores: ['R.J. Palacio'], generos: ['Infantojuvenil', 'Drama'], editora: 'Knopf', ano: 2012, sinopse: 'Auggie Pullman, nascido com uma deformidade facial, enfrenta o desafio de frequentar a escola pela primeira vez.', preco: '28.00' },
  { isbn: '9781471156267', titulo: 'It Ends with Us', autores: ['Colleen Hoover'], generos: ['Romance', 'Drama'], editora: 'Atria', ano: 2016, sinopse: 'Lily supera uma infância difícil e se apaixona por um neurocirurgião, mas enfrenta dilemas ao repetir padrões do passado.', preco: '36.00' },
  // ── Mais Bestsellers (Novos) ──
  { isbn: '9780439139601', titulo: 'Harry Potter and the Goblet of Fire', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Scholastic', ano: 2000, sinopse: 'O quarto ano de Harry em Hogwarts traz o perigoso Torneio Tribruxo.', preco: '45.00' },
  { isbn: '9780439358071', titulo: 'Harry Potter and the Order of the Phoenix', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Scholastic', ano: 2003, sinopse: 'Harry descobre que a comunidade bruxa não acredita no retorno de Voldemort e funda a Armada de Dumbledore.', preco: '49.00' },
  { isbn: '9781408855652', titulo: 'Harry Potter and the Half-Blood Prince', autores: ['J.K. Rowling'], generos: ['Fantasia', 'Jovem adulto'], editora: 'Bloomsbury', ano: 2005, sinopse: 'Harry descobre o passado de Lord Voldemort enquanto se prepara para a guerra.', preco: '45.00' },
  { isbn: '9780451524935', titulo: '1984', autores: ['George Orwell'], generos: ['Ficção', 'Distopia'], editora: 'Signet', ano: 1949, sinopse: 'O Grande Irmão observa tudo em uma sociedade totalitária e sem liberdade.', preco: '25.00' },
  { isbn: '9780451526342', titulo: 'Animal Farm', autores: ['George Orwell'], generos: ['Ficção', 'Fábula'], editora: 'Signet', ano: 1945, sinopse: 'Uma sátira política onde os animais de uma fazenda tomam o controle.', preco: '20.00' },
  { isbn: '9781451673319', titulo: 'Fahrenheit 451', autores: ['Ray Bradbury'], generos: ['Ficção científica', 'Distopia'], editora: 'Simon & Schuster', ano: 1953, sinopse: 'Em um futuro opressivo, bombeiros são contratados para queimar livros.', preco: '28.00' },
  { isbn: '9780060935467', titulo: 'To Kill a Mockingbird', autores: ['Harper Lee'], generos: ['Ficção', 'Clássico'], editora: 'Harper Perennial', ano: 1960, sinopse: 'Uma história sobre racismo e injustiça no sul dos Estados Unidos.', preco: '30.00' },
  { isbn: '9780743273565', titulo: 'The Great Gatsby', autores: ['F. Scott Fitzgerald'], generos: ['Ficção', 'Clássico'], editora: 'Scribner', ano: 1925, sinopse: 'A decadência do sonho americano nos loucos anos 1920.', preco: '22.00' },
  { isbn: '9780062316097', titulo: 'Sapiens: A Brief History of Humankind', autores: ['Yuval Noah Harari'], generos: ['Não-ficção', 'História'], editora: 'Harper', ano: 2015, sinopse: 'Uma exploração fascinante sobre a história e a evolução da humanidade.', preco: '55.00' },
  { isbn: '9780553418026', titulo: 'The Martian', autores: ['Andy Weir'], generos: ['Ficção científica', 'Aventura'], editora: 'Crown', ano: 2014, sinopse: 'Um astronauta abandonado em Marte precisa usar sua inteligência para sobreviver.', preco: '42.00' },
  { isbn: '9780307887443', titulo: 'Ready Player One', autores: ['Ernest Cline'], generos: ['Ficção científica', 'Aventura'], editora: 'Crown', ano: 2011, sinopse: 'Em 2045, o mundo se refugia na realidade virtual OASIS, onde um caçador de recompensas bilionário escondeu seu testamento.', preco: '38.00' },
  { isbn: '9780441172719', titulo: 'Dune', autores: ['Frank Herbert'], generos: ['Ficção científica', 'Épico'], editora: 'Ace', ano: 1965, sinopse: 'Política, religião e ecologia se misturam no deserto árido do planeta Arrakis.', preco: '48.00' },
  { isbn: '9780143034902', titulo: 'The Shadow of the Wind', autores: ['Carlos Ruiz Zafón'], generos: ['Ficção', 'Mistério'], editora: 'Penguin', ano: 2004, sinopse: 'Um jovem descobre um livro misterioso em Barcelona pós-Guerra Civil e é arrastado para um labirinto de segredos.', preco: '35.00' },
  { isbn: '9780439023511', titulo: 'Mockingjay', autores: ['Suzanne Collins'], generos: ['Ficção científica', 'Jovem adulto'], editora: 'Scholastic', ano: 2010, sinopse: 'Katniss Everdeen se torna o símbolo da rebelião contra a Capital.', preco: '39.90' },
];

async function seedFromOpenLibrary() {
  console.log('\n📚 Iniciando seed com capas da Open Library...\n');
  let created = 0, skipped = 0;

  for (const b of LIVROS_OPEN_LIBRARY) {
    try {
      const existing = await prisma.livro.findFirst({ where: { isbn: b.isbn } });
      if (existing) { skipped++; continue; }

      const capaUrl = openLibraryCover(b.isbn);

      const createdLivro = await prisma.livro.create({
        data: {
          titulo: b.titulo,
          sinopse: b.sinopse || null,
          editora: b.editora || null,
          ano_publicacao: b.ano || null,
          isbn: b.isbn,
          nota_conservacao: 5,
          descricao_conservacao: null,
          destaque_vitrine: !!b.destaque,
          imagens: {
            create: buildImagensCreateWithCapa(9000 + created, capaUrl),
          },
        },
      });

      for (const authorName of (b.autores || [])) {
        let author = await prisma.autor.findFirst({ where: { nome_completo: authorName } });
        if (!author) author = await prisma.autor.create({ data: { nome_completo: authorName } });
        await prisma.livroAutor.create({ data: { id_livro: createdLivro.id_livro, id_autor: author.id_autor } });
      }

      for (const generoName of (b.generos || [])) {
        let genero = await prisma.genero.findUnique({ where: { nome: generoName } }).catch(() => null);
        if (!genero) genero = await prisma.genero.create({ data: { nome: generoName } });
        await prisma.livroGenero.create({ data: { id_livro: createdLivro.id_livro, id_genero: genero.id_genero } });
      }

      await prisma.estoque.create({
        data: { id_livro: createdLivro.id_livro, preco: b.preco || '29.90', condicao: 'novo', disponivel: true },
      });

      created++;
      console.log(`  ✓ ${b.titulo} — capa: ${capaUrl}`);
    } catch (err) {
      console.error(`  ✗ Erro ao criar ${b.titulo}:`, err.message || err);
    }
  }
  console.log(`\n📚 Open Library seed concluído: ${created} criados, ${skipped} já existiam\n`);
}

async function runAll() {
  try {
    await main();
    await seedUsuariosClientes();
    
    console.log('Limpando livros antigos do banco...');
    await prisma.estoque.deleteMany();
    await prisma.livroAutor.deleteMany();
    await prisma.livroGenero.deleteMany();
    await prisma.imagemLivro.deleteMany();
    await prisma.livro.deleteMany();

    await seedFromOpenLibrary();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAll();
