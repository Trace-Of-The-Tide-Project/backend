import { User } from '../users/models/user.model';
import * as bcrypt from 'bcrypt';

export async function seedUsers() {
  const hashedAdmin = await bcrypt.hash('Admin@123', 10);
  const hashedAdmin2 = await bcrypt.hash('Test@1234', 10);
  const hashedUser = await bcrypt.hash('User@123', 10);

  const usersData = [
    { username: 'admin', full_name: 'Super Admin', email: 'admin@example.com', phone_number: '0100000000', password: hashedAdmin, status: 'active' },
    { username: 'admin2', full_name: 'Super Admin2', email: 'admin@trace.ps', phone_number: '0100000051', password: hashedAdmin2, status: 'active' },
    { username: 'moderator1', full_name: 'Moderator One', email: 'moderator1@example.com', phone_number: '01000000001', password: hashedUser, status: 'active' },
    { username: 'moderator2', full_name: 'Moderator Two', email: 'moderator2@example.com', phone_number: '01000000002', password: hashedUser, status: 'active' },
    { username: 'editor1', full_name: 'Editor One', email: 'editor1@example.com', phone_number: '01000000003', password: hashedUser, status: 'active' },
    { username: 'editor2', full_name: 'Editor Two', email: 'editor2@example.com', phone_number: '01000000004', password: hashedUser, status: 'active' },
    { username: 'user1', full_name: 'User One', email: 'user1@example.com', phone_number: '01000000005', password: hashedUser, status: 'active' },
    { username: 'user2', full_name: 'User Two', email: 'user2@example.com', phone_number: '01000000006', password: hashedUser, status: 'active' },
    { username: 'user3', full_name: 'User Three', email: 'user3@example.com', phone_number: '01000000007', password: hashedUser, status: 'active' },
    { username: 'user4', full_name: 'User Four', email: 'user4@example.com', phone_number: '01000000008', password: hashedUser, status: 'active' },
    { username: 'user5', full_name: 'User Five', email: 'user5@example.com', phone_number: '01000000009', password: hashedUser, status: 'active' },
    { username: 'author', full_name: 'author', email: 'author@example.com', phone_number: '0100000005110', password: hashedUser, status: 'active' },
  ];

  const users: User[] = [];
  for (const data of usersData) {
    const [user] = await User.findOrCreate({
      where: { username: data.username },
      defaults: data as any,
    });
    users.push(user);
  }

  console.log(`✅ Users seeded (${users.length} total)`);
  return users;
}