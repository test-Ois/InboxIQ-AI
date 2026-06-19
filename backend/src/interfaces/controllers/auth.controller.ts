import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthenticatedUser } from '../../common/guards/auth.guard';
import { GetUser } from '../../common/decorators/user.decorator';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
  /**
   * GET /api/auth/profile
   * Returns profile of the authenticated user.
   */
  @Get('profile')
  async getProfile(@GetUser() user: AuthenticatedUser) {
    return user;
  }
}
