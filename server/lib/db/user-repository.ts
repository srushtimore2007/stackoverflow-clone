import bcrypt from 'bcryptjs';
import UserModel from '../../models/auth';
import type { User, PasswordResetResult } from '../../types/auth.types';

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    return await UserModel.findOne({ email });
  }

  static async findByPhone(phone: string): Promise<User | null> {
    return await UserModel.findOne({ phone });
  }

  static async canResetPassword(user: any): Promise<PasswordResetResult> {
    if (!user.forgotPasswordAt) {
      return { canReset: true };
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const diff = Date.now() - new Date(user.forgotPasswordAt).getTime();

    if (diff >= ONE_DAY) {
      return { canReset: true };
    }

    return {
      canReset: false,
      remainingHours: Math.ceil((ONE_DAY - diff) / (1000 * 60 * 60)),
    };
  }

  static async updatePassword(userId: string, plainPassword: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    return await UserModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        forgotPasswordAt: new Date(),
      },
      { new: true }
    );
  }
}
