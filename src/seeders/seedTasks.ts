import { Task } from '../tasks/models/task.model';
import { User } from '../users/models/user.model';
import { Article } from '../articles/models/article.model';
import { Contribution } from '../contributions/models/contribution.model';

export async function seedTasks() {
  const admin = await User.findOne({ where: { username: 'admin' } });
  const editor = await User.findOne({ where: { username: 'editor1' } });
  const author = await User.findOne({ where: { username: 'author' } });

  if (!admin || !editor) {
    console.warn('⚠️ Required users not found for tasks seeding.');
    return;
  }

  const article = await Article.findOne();
  const contribution = await Contribution.findOne();

  const tasksData = [
    {
      title: 'Review Palestinian Heritage Article',
      description: 'Review the article on British immigration restrictions for accuracy and publish it.',
      status: 'pending',
      priority: 'high',
      due_date: new Date('2026-04-15'),
      assignee_id: editor.id,
      assigner_id: admin.id,
      article_id: article?.id || null,
    },
    {
      title: 'Translate Article to Arabic',
      description: 'Full translation of the heritage article into Arabic, maintaining cultural context.',
      status: 'in_progress',
      priority: 'medium',
      due_date: new Date('2026-04-30'),
      assignee_id: author?.id || editor.id,
      assigner_id: admin.id,
      article_id: article?.id || null,
    },
    {
      title: 'Moderate New Contributions',
      description: 'Review and approve/reject the latest batch of community contributions.',
      status: 'pending',
      priority: 'high',
      due_date: new Date('2026-04-10'),
      assignee_id: editor.id,
      assigner_id: admin.id,
      contribution_id: contribution?.id || null,
    },
    {
      title: 'Update SEO for Open Calls',
      description: 'Add proper SEO metadata to all open call pages for better discoverability.',
      status: 'completed',
      priority: 'low',
      due_date: new Date('2026-03-25'),
      assignee_id: editor.id,
      assigner_id: admin.id,
    },
    {
      title: 'Design Cover Image for Heritage Walk',
      description: 'Create a compelling cover image for the Heritage Walk trip page.',
      status: 'pending',
      priority: 'medium',
      due_date: new Date('2026-05-01'),
      assignee_id: author?.id || editor.id,
      assigner_id: editor.id,
    },
  ];

  for (const data of tasksData) {
    await Task.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
  }

  console.log('✅ Tasks seeded successfully');
}
