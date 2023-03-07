import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userTypes } from 'src/shared/schema/users';
import config from 'config';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { generateHashPassword } from 'src/shared/utility/passwordManager';
import { sendEmail } from 'src/shared/utility/mailHandler';
import { comparePassword } from '../shared/utility/passwordManager';
import { generateAuthToken } from 'src/shared/utility/tokenGenerator';

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
      } else if (createUserDto.type !== userTypes.CUSTOMER) {
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

      //NEW USER CREATE
      const newUser = await this.userDB.create({
        // ...CreateUserDto,
        name: createUserDto.name,
        email: createUserDto.email,
        password: createUserDto.password,
        type: createUserDto.type,
        otp,
        otpExpiryTime,
      });

      if (newUser.type !== userTypes.ADMIN) {
        sendEmail(
          newUser.email,
          config.get('emailService.emailTemplates.verifyEmail'),
          'Email verification - nestCommerce',
          {
            customerName: newUser.name,
            customerEmail: newUser.email,
            otp,
          },
        );
      }
      return {
        success: true,
        message:
          newUser.type === userTypes.ADMIN
            ? 'Admin Created'
            : 'Please activate your account by verifying your email',
        result: { email: newUser.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const userExists = await this.userDB.findOne({
        email,
      });
      if (!userExists) {
        throw new Error('Invalid credentials');
      }
      if (!userExists.isVerified) {
        throw new Error('Please Verify Your Email');
      }
      const isPasswordMatch = await comparePassword(
        password,
        userExists.password,
      );
      if (!isPasswordMatch) {
        throw new Error('Invalid credentials');
      }
      const token = generateAuthToken(userExists._id);
      return {
        success: true,
        message: 'Login Success',
        result: {
          user: {
            name: userExists.name,
            email: userExists.email,
            type: userExists.type,
            id: userExists._id.toString(),
          },
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(otp: string, email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (user.otp !== otp) {
        throw new Error('Invalid otp');
      }
      if (user.otpExpiryTime < new Date()) {
        throw new Error('otp expired');
      }
      await this.userDB.updateOne(
        {
          email,
        },
        { isVerified: true },
      );
      return {
        success: true,
        message: 'Email verified succesfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async sendOtpEmail(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (user.isVerified) {
        throw new Error('Email already verified');
      }
      const otp = Math.floor(Math.random() * 900000) + 1000000;
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 5);
      await this.userDB.updateOne({ email }, { otp, otpExpiryTime });

      sendEmail(
        user.email,
        config.get('emailService.emailTemplates.verifyEmail'),
        'Email verification - nestCommerce',
        {
          customerName: user.name,
          customerEmail: user.email,
          otp,
        },
      );
      return {
        success: true,
        message: 'otp send successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async forgetPassword(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not Found');
      }
      const password = Math.random().toString(36).substring
      return {
        success: true,
        message: 'otp send successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  // findOne(id: number) {
  //   try {
  //     return `This action returns all users`;
  //   } catch (error) {
  //     throw new error();
  //   }
  // }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
