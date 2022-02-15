import {
  JsonController,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  Authorized,
  BadRequestError,
  QueryParam
} from 'routing-controllers';
import { InsertResult, UpdateResult, DeleteResult } from 'typeorm';
import { Service } from 'typedi';
import { User } from '@entities/user.entity';
import { UsersService } from '@services/users.service';
import { ErrorsMessages } from '../constants/errorMessages';
import { SignUpDTO } from '@dto/signUpDTO';
import { EntityMapper } from '@clients/mapper/entityMapper.service';
import { RecoverPassDTO } from '@dto/recoverPassDTO';
import { ResetPassDTO } from '@dto/resetPassDTO';

@JsonController('/users')
@Service()
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Authorized()
  @Get()
  async index(): Promise<User[]> {
    return this.usersService.listUsers();
  }

  @Get('/verify')
  async verify(
    @QueryParam('key') key: string
  ) {
    return this.usersService.verifyUser(key);
  }

  @Get('/:id')
  async show(@Param('id') id: number): Promise<User | undefined> {
    return this.usersService.showUserBy({ id });
  }

  @Post()
  async post(@Body() userDTO: SignUpDTO): Promise<InsertResult> {
    try {
      const user = await this.usersService.createUser(
        EntityMapper.mapTo(User, userDTO)
      );
      return user;
    } catch (error: any) {
      throw new BadRequestError(
        error.detail ?? error.message ?? ErrorsMessages.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('/:id')
  async put(
    @Param('id') id: number,
    @Body() userDTO: SignUpDTO
  ): Promise<UpdateResult> {
    const user: User = EntityMapper.mapTo(User, userDTO);
    return this.usersService.editUser({ id, user });
  }

  @Delete('/:id')
  async delete(@Param('id') id: number): Promise<DeleteResult> {
    return this.usersService.deleteUser(id);
  }

  @Post('/recoverPassword')
  async recoverPassword(
    @Body({ validate: true }) recoverPassDTO: RecoverPassDTO
  ): Promise<boolean> {
    return this.usersService.recoverPassword(
      recoverPassDTO
    );
  }

  @Post('/resetPassword')
  async resetPassword(
    @Body({ validate: true }) resetPassDTO: ResetPassDTO
  ): Promise<string> {
    const user = await this.usersService.resetPassword(resetPassDTO);
    return this.usersService.generateToken(user);
  }
}
