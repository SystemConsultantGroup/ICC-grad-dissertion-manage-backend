import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { MinioClientModule } from './config/file/minio-client.module';
import { DepartmentsModule } from './modules/departments/departments.module';

@Module({
  imports: [AppConfigModule, AuthModule, MinioClientModule, DepartmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
