import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'; 
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({transform:true}));
  app.use(cookieParser());

  const config=new DocumentBuilder()
  .setTitle('IELTS EXAMS')
  .setDescription('API Documentation for ielts backend')
  .setVersion('1.0')
  .build();


  const document=SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api', app,document);


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
