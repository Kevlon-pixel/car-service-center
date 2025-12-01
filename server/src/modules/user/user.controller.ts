import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { SystemRole } from '@prisma/client';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('access-token')
  @Roles(SystemRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @Post()
  async createUser(@Req() req, @Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @Patch('me')
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  async getMe(@Req() req) {
    const user = await this.userService.findUserById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @Delete(':id')
  async deleteUser(@Req() req, @Param('id') id: string) {
    if (req.user.id === id) {
      throw new ForbiddenException('Users cannot delete themselves');
    }
    return this.userService.deleteUser(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRole.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @Get()
  async getAllUsers() {
    return this.userService.findAllUsers();
  }

  @ApiBearerAuth('access-token')
  @Roles(SystemRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get a user by id (admin only)' })
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }
}
