import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  // Register runtime path mapping so compiled dist imports using '@/...'
  // resolve to files under dist/ when this script runs from dist.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tsconfigPaths = require('tsconfig-paths');
    const distBase = path.resolve(process.cwd(), 'dist');
    tsconfigPaths.register({ baseUrl: distBase, paths: { '@/*': ['*'] } });
  } catch (e) {
    // ignore if tsconfig-paths is not available; best-effort mapping
  }

  // Dynamically require the compiled AppModule from dist so we avoid
  // static imports that would be resolved before we register paths.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppModule } = require(path.resolve(process.cwd(), 'dist', 'app'));

  // Create Nest application (don't listen)
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('LIA API')
    .setDescription('API documentation for LIA project')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // write the OpenAPI snapshot to a versioned docs directory so it can be
  // committed and served statically (e.g. GitHub Pages / docs/).
  const outDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'openapi.json');
  fs.writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log('OpenAPI generated at', outFile);
}

generate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
