import { File } from '../files/models/file.model';
import { Contribution } from '../contributions/models/contribution.model';
import { User } from '../users/models/user.model';

export async function seedFiles(adminUser: User, contributions: Contribution[]) {
  const filesData = [
    {
      contribution_id: contributions[0].id,
      file_name: 'family_story.pdf',
      mime_type: 'application/pdf',
      file_size: 204800,
      path: 'uploads/family_story.pdf',
      uploaded_by: adminUser.id,
      upload_date: new Date(),
    },
    {
      contribution_id: contributions[1].id,
      file_name: 'folk_songs.mp3',
      mime_type: 'audio/mpeg',
      file_size: 5096000,
      path: 'uploads/folk_songs.mp3',
      uploaded_by: adminUser.id,
      upload_date: new Date(),
      duration: '03:45',
    },
  ];

  for (const data of filesData) {
    await File.findOrCreate({
      where: { contribution_id: data.contribution_id, file_name: data.file_name },
      defaults: data as any,
    });
  }

  console.log('✅ Files seeded');
}