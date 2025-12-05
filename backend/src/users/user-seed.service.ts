import { Injectable } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class UserSeedService {
  constructor(private readonly usersService: UsersService) {}

  async createAdminUser() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const adminRole = process.env.DEFAULT_ADMIN_ROLE || 'admin';

    const exists = await this.usersService.findByEmail(adminEmail);

    if (!exists) {
      await this.usersService.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: adminRole,
      });

      console.log('🟢 Admin criado automaticamente:', adminEmail);
    } else {
      console.log('ℹ️ Admin já existe:', adminEmail);
    }
  }
}
