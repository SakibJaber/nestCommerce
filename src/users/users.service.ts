import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userTypes } from 'src/shared/schema/users';
import config from 'config';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { generateHashPassword } from 'src/shared/utility/passwordManager';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      // GEN HASH PASS
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );
      // CHECK IS ADMIN OR CUSTOMER
      if (
        createUserDto.type === userTypes.ADMIN &&
        createUserDto.secretToken !== config.get('adminSecretToken')
      ) {
        throw new Error('Unauthorized Request');
      } else {
        createUserDto.isVerified = true;
      }
      // CHECK EXISTING USER
      const user = await this.userDB.findOne({
        // findOne From UserRepository
        email: createUserDto.email,
      });
      if (user) {
        throw new Error('User Already Exist');
      }

      // GENERATE OTP
      const otp = Math.floor(Math.random() * 9000000) + 1000000;
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 5);

      const newUser = await this.userDB.create({
        ...CreateUserDto,
        otp,
        otpExpiryTime,
      });
      if (newUser.type !== userTypes.ADMIN) {
        sendEmail();
      }
      return {
        success: true,
        message: 'User created successfully',
        result: { email: newUser.email },
      };
    } catch (error) {
      throw error;
    }
  }

  login(email: string, password: string) {
    return 'Logged in';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
