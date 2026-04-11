import { Board } from '../boards/models/board.model';
import { BoardPage } from '../boards/models/board-page.model';
import { BoardElement } from '../boards/models/board-element.model';
import { BoardMember } from '../boards/models/board-member.model';
import { BoardTemplate } from '../boards/models/board-template.model';
import { User } from '../users/models/user.model';

export async function seedBoards() {
  const admin = await User.findOne({ where: { username: 'admin' } });
  const editor = await User.findOne({ where: { username: 'editor1' } });

  if (!admin) {
    console.warn('⚠️ Admin user not found for boards seeding.');
    return;
  }

  // Seed templates
  const templatesData = [
    {
      name: 'Brainstorm Map',
      description: 'A blank canvas for collaborative brainstorming sessions.',
      category: 'planning',
      thumbnail: 'templates/brainstorm.png',
      template_data: JSON.stringify({
        pages: [{ title: 'Main Board' }],
        elements: [
          {
            element_type: 'sticky_note',
            x: 400,
            y: 300,
            content: 'Main Idea',
            properties: '{"color":"yellow"}',
          },
          {
            element_type: 'sticky_note',
            x: 200,
            y: 150,
            content: 'Idea 1',
            properties: '{"color":"blue"}',
          },
          {
            element_type: 'sticky_note',
            x: 600,
            y: 150,
            content: 'Idea 2',
            properties: '{"color":"green"}',
          },
        ],
      }),
    },
    {
      name: 'Editorial Workflow',
      description: 'Organize your editorial pipeline with stages and tasks.',
      category: 'editorial',
      thumbnail: 'templates/editorial.png',
      template_data: JSON.stringify({
        pages: [{ title: 'Pipeline' }],
        elements: [
          {
            element_type: 'rectangle',
            x: 50,
            y: 50,
            width: 250,
            height: 500,
            content: 'Draft',
            properties: '{"color":"#f0f0f0"}',
          },
          {
            element_type: 'rectangle',
            x: 350,
            y: 50,
            width: 250,
            height: 500,
            content: 'In Review',
            properties: '{"color":"#fff3cd"}',
          },
          {
            element_type: 'rectangle',
            x: 650,
            y: 50,
            width: 250,
            height: 500,
            content: 'Published',
            properties: '{"color":"#d4edda"}',
          },
        ],
      }),
    },
  ];

  for (const data of templatesData) {
    await BoardTemplate.findOrCreate({
      where: { name: data.name },
      defaults: data as any,
    });
  }

  // Seed boards
  const boardsData = [
    {
      title: 'Heritage Documentation Strategy',
      description:
        'Planning board for the Palestinian heritage documentation project.',
      owner_id: admin.id,
      status: 'active',
      visibility: 'team',
      settings: JSON.stringify({
        grid: true,
        minimap: true,
        background_color: '#fafafa',
      }),
    },
    {
      title: 'Open Call Planning',
      description: 'Brainstorm and plan upcoming open calls.',
      owner_id: admin.id,
      status: 'active',
      visibility: 'private',
    },
  ];

  const boards: Board[] = [];
  for (const data of boardsData) {
    const [board] = await Board.findOrCreate({
      where: { title: data.title },
      defaults: data as any,
    });
    boards.push(board);
  }

  // Add editor as member of first board
  if (editor && boards[0]) {
    await BoardMember.findOrCreate({
      where: { board_id: boards[0].id, user_id: editor.id },
      defaults: {
        board_id: boards[0].id,
        user_id: editor.id,
        role: 'editor',
      } as any,
    });
  }

  // Add pages and elements to first board
  if (boards[0]) {
    const [page1] = await BoardPage.findOrCreate({
      where: { board_id: boards[0].id, title: 'Strategy Overview' },
      defaults: {
        board_id: boards[0].id,
        title: 'Strategy Overview',
        page_order: 1,
      } as any,
    });

    const [page2] = await BoardPage.findOrCreate({
      where: { board_id: boards[0].id, title: 'Timeline' },
      defaults: {
        board_id: boards[0].id,
        title: 'Timeline',
        page_order: 2,
      } as any,
    });

    // Add elements to page 1
    const elementsData = [
      {
        page_id: page1.id,
        board_id: boards[0].id,
        created_by: admin.id,
        element_type: 'sticky_note',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        z_index: 1,
        content: 'Document oral histories from Nakba survivors',
        properties: JSON.stringify({ color: 'yellow' }),
      },
      {
        page_id: page1.id,
        board_id: boards[0].id,
        created_by: admin.id,
        element_type: 'sticky_note',
        x: 350,
        y: 100,
        width: 200,
        height: 200,
        z_index: 2,
        content: 'Partner with universities for archiving',
        properties: JSON.stringify({ color: 'blue' }),
      },
      {
        page_id: page1.id,
        board_id: boards[0].id,
        created_by: admin.id,
        element_type: 'text',
        x: 100,
        y: 350,
        width: 450,
        height: 50,
        z_index: 3,
        content: 'Heritage Documentation — Key Priorities 2026',
        properties: JSON.stringify({ fontSize: 24, fontWeight: 'bold' }),
      },
      {
        page_id: page1.id,
        board_id: boards[0].id,
        created_by: admin.id,
        element_type: 'rectangle',
        x: 600,
        y: 100,
        width: 300,
        height: 400,
        z_index: 0,
        content: 'Notes Area',
        properties: JSON.stringify({ color: '#f5f5f5', borderColor: '#ddd' }),
      },
    ];

    for (const el of elementsData) {
      await BoardElement.findOrCreate({
        where: {
          page_id: el.page_id,
          element_type: el.element_type,
          x: el.x,
          y: el.y,
        },
        defaults: el as any,
      });
    }
  }

  console.log('✅ Boards seeded successfully');
}
