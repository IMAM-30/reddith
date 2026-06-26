const express = require('express');
const request = require('supertest');

jest.mock('../src/models', () => ({
  Post: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Community: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  CommunityUser: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  User: {},
  Comment: {
    count: jest.fn(),
    findAll: jest.fn(),
  },
  Vote: {
    TYPE_POST: 'post',
    sum: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../src/utils/asset', () => ({
  assetUrl: jest.fn((path) => (path ? `/storage/${path}` : null)),
}));

jest.mock('../src/middleware/upload', () => ({
  relativePathFromFile: jest.fn(() => null),
  deleteStorageFile: jest.fn(),
}));

jest.mock('../src/utils/notification', () => ({
  createNotification: jest.fn(),
  TYPES: { COMMUNITY_POST: 'community_post' },
}));

const {
  Post,
  Community,
  CommunityUser,
  Comment,
  Vote,
} = require('../src/models');
const { createNotification } = require('../src/utils/notification');
const postController = require('../src/controllers/postController');

function makePost(overrides = {}) {
  const post = {
    id: 1,
    user_id: 1,
    community_id: null,
    title: 'Judul diskusi',
    body: 'Isi diskusi mahasiswa.',
    image: null,
    user: { id: 1, name: 'Raihan', username: 'raihan', avatar: null },
    community: null,
    update: jest.fn(async function update(values) {
      Object.assign(this, values);
      return this;
    }),
    destroy: jest.fn(async () => undefined),
    ...overrides,
  };

  post.toJSON = () => ({
    id: post.id,
    user_id: post.user_id,
    community_id: post.community_id,
    title: post.title,
    body: post.body,
    image: post.image,
    user: post.user,
    community: post.community,
  });

  return post;
}

function buildApp() {
  const app = express();
  app.use(express.json());

  const fakeAuth = (req, res, next) => {
    req.user = { id: 1, username: 'raihan', avatar: null };
    next();
  };

  app.get('/api/posts', postController.index);
  app.get('/api/posts/:id', postController.show);
  app.get('/api/communities/:slug/posts', postController.byCommunity);
  app.post('/api/posts', fakeAuth, postController.store);
  app.put('/api/posts/:id', fakeAuth, postController.update);
  app.delete('/api/posts/:id', fakeAuth, postController.destroy);

  return app;
}

describe('Posts API - Regression Test Suite', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.clearAllMocks();

    Community.findAll.mockResolvedValue([]);
    Community.findOne.mockResolvedValue(null);
    CommunityUser.findAll.mockResolvedValue([]);
    Community.findByPk.mockResolvedValue(null);
    Comment.findAll.mockResolvedValue([]);
    Comment.count.mockResolvedValue(0);
    Vote.findAll.mockResolvedValue([]);
    Vote.sum.mockResolvedValue(0);
    Vote.findOne.mockResolvedValue(null);
  });

  test('GET /api/posts mengembalikan daftar post dengan metadata pagination', async () => {
    // Arrange
    const post = makePost();
    Post.findAndCountAll.mockResolvedValue({ rows: [post], count: 1 });
    Comment.findAll.mockResolvedValue([{ post_id: 1, cnt: 2 }]);
    Vote.findAll.mockResolvedValue([{ voteable_id: 1, total: 3 }]);

    // Act
    const response = await request(app).get('/api/posts');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0]).toMatchObject({
      id: 1,
      title: 'Judul diskusi',
      comments_count: 2,
      votes_sum_value: 3,
      user_vote: 0,
    });
  });

  test('GET /api/posts tetap stabil ketika data kosong', async () => {
    // Arrange
    Post.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    // Act
    const response = await request(app).get('/api/posts');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  test('GET /api/posts/:id mengembalikan detail post yang ditemukan', async () => {
    // Arrange
    Post.findByPk.mockResolvedValue(makePost({ id: 7, title: 'Pengumuman UKM' }));
    Comment.count.mockResolvedValue(4);
    Vote.sum.mockResolvedValue(6);

    // Act
    const response = await request(app).get('/api/posts/7');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 7,
      title: 'Pengumuman UKM',
      comments_count: 4,
      votes_sum_value: 6,
    });
  });

  test('GET /api/posts/:id mengembalikan 404 ketika post tidak ditemukan', async () => {
    // Arrange
    Post.findByPk.mockResolvedValue(null);

    // Act
    const response = await request(app).get('/api/posts/999');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Post tidak ditemukan.');
  });

  test('GET /api/posts/:id menolak post dari community privat tanpa akses', async () => {
    // Arrange
    Post.findByPk.mockResolvedValue(makePost({ community_id: 3 }));
    Community.findByPk.mockResolvedValue({
      id: 3,
      user_id: 2,
      visibility: 'private',
    });
    CommunityUser.findOne.mockResolvedValue(null);

    // Act
    const response = await request(app).get('/api/posts/3');

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.restricted).toBe(true);
  });

  test('GET /api/communities/:slug/posts mengembalikan 404 untuk community tidak ditemukan', async () => {
    // Arrange
    Community.findOne.mockResolvedValue(null);

    // Act
    const response = await request(app).get('/api/communities/tidak-ada/posts');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Community tidak ditemukan.');
  });

  test('GET /api/communities/:slug/posts mengembalikan daftar post community yang dapat diakses', async () => {
    // Arrange
    Community.findOne.mockResolvedValue({
      id: 8,
      user_id: 1,
      visibility: 'public',
    });
    Post.findAndCountAll.mockResolvedValue({
      rows: [makePost({ id: 8, community_id: 8 })],
      count: 1,
    });

    // Act
    const response = await request(app).get('/api/communities/ilkom/posts');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(Post.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { community_id: 8 },
    }));
  });

  test('POST /api/posts membuat post baru dengan input valid', async () => {
    // Arrange
    const created = makePost({ id: 21, title: 'Agenda kelas' });
    Post.create.mockResolvedValue({ id: 21 });
    Post.findByPk.mockResolvedValue(created);

    // Act
    const response = await request(app)
      .post('/api/posts')
      .send({ title: 'Agenda kelas', body: 'Diskusi jadwal pengganti.' });

    // Assert
    expect(response.status).toBe(201);
    expect(Post.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 1,
      title: 'Agenda kelas',
      body: 'Diskusi jadwal pengganti.',
    }));
    expect(response.body.title).toBe('Agenda kelas');
  });

  test('POST /api/posts menolak request tanpa title', async () => {
    // Arrange, Act
    const response = await request(app)
      .post('/api/posts')
      .send({ body: 'Konten tanpa judul.' });

    // Assert
    expect(response.status).toBe(422);
    expect(response.body.errors.title).toContain('Title required.');
    expect(Post.create).not.toHaveBeenCalled();
  });

  test('POST /api/posts menolak community_id yang tidak valid', async () => {
    // Arrange
    Community.findByPk.mockResolvedValue(null);

    // Act
    const response = await request(app)
      .post('/api/posts')
      .send({ title: 'Info lomba', community_id: 404 });

    // Assert
    expect(response.status).toBe(422);
    expect(response.body.errors.community_id).toContain('Community tidak ditemukan.');
    expect(Post.create).not.toHaveBeenCalled();
  });

  test('POST /api/posts mengirim notifikasi ketika post dibuat di community', async () => {
    // Arrange
    const community = { id: 3, name: 'Ilmu Komputer', slug: 'ilkom', icon: null };
    const fullPost = makePost({
      id: 31,
      title: 'Diskusi praktikum',
      community_id: 3,
      community,
    });
    Community.findByPk.mockResolvedValue(community);
    CommunityUser.findAll.mockResolvedValue([{ user_id: 2 }, { user_id: 3 }]);
    Post.create.mockResolvedValue({ id: 31 });
    Post.findByPk.mockResolvedValue(fullPost);

    // Act
    const response = await request(app)
      .post('/api/posts')
      .send({ title: 'Diskusi praktikum', community_id: 3 });

    // Assert
    expect(response.status).toBe(201);
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(response.body.community.slug).toBe('ilkom');
  });

  test('PUT /api/posts/:id memperbarui post milik pengguna', async () => {
    // Arrange
    const existing = makePost({ id: 12, title: 'Judul lama' });
    const updated = makePost({ id: 12, title: 'Judul baru', body: 'Isi baru' });
    Post.findByPk.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

    // Act
    const response = await request(app)
      .put('/api/posts/12')
      .send({ title: 'Judul baru', body: 'Isi baru' });

    // Assert
    expect(response.status).toBe(200);
    expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Judul baru',
      body: 'Isi baru',
    }));
    expect(response.body.title).toBe('Judul baru');
  });

  test('PUT /api/posts/:id menolak update dari bukan pemilik post', async () => {
    // Arrange
    const existing = makePost({ id: 12, user_id: 99 });
    Post.findByPk.mockResolvedValue(existing);

    // Act
    const response = await request(app)
      .put('/api/posts/12')
      .send({ title: 'Judul baru' });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Unauthorized.');
    expect(existing.update).not.toHaveBeenCalled();
  });

  test('PUT /api/posts/:id mengembalikan 404 ketika post tidak ditemukan', async () => {
    // Arrange
    Post.findByPk.mockResolvedValue(null);

    // Act
    const response = await request(app)
      .put('/api/posts/999')
      .send({ title: 'Judul baru' });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Post tidak ditemukan.');
  });

  test('PUT /api/posts/:id menolak title kosong agar validasi tidak regresi', async () => {
    // Arrange
    const existing = makePost({ id: 12 });
    Post.findByPk.mockResolvedValue(existing);

    // Act
    const response = await request(app)
      .put('/api/posts/12')
      .send({ title: '' });

    // Assert
    expect(response.status).toBe(422);
    expect(response.body.errors.title).toContain('Title required.');
    expect(existing.update).not.toHaveBeenCalled();
  });

  test('PUT /api/posts/:id menolak community_id yang tidak ditemukan', async () => {
    // Arrange
    const existing = makePost({ id: 12 });
    Post.findByPk.mockResolvedValue(existing);
    Community.findByPk.mockResolvedValue(null);

    // Act
    const response = await request(app)
      .put('/api/posts/12')
      .send({ title: 'Judul baru', community_id: 999 });

    // Assert
    expect(response.status).toBe(422);
    expect(response.body.errors.community_id).toContain('Community tidak ditemukan.');
    expect(existing.update).not.toHaveBeenCalled();
  });

  test('DELETE /api/posts/:id menghapus post milik pengguna', async () => {
    // Arrange
    const existing = makePost({ id: 5 });
    Post.findByPk.mockResolvedValue(existing);

    // Act
    const response = await request(app).delete('/api/posts/5');

    // Assert
    expect(response.status).toBe(200);
    expect(existing.destroy).toHaveBeenCalledTimes(1);
    expect(response.body.message).toBe('Post deleted.');
  });

  test('DELETE /api/posts/:id mengembalikan 404 ketika post tidak ditemukan', async () => {
    // Arrange
    Post.findByPk.mockResolvedValue(null);

    // Act
    const response = await request(app).delete('/api/posts/404');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Post tidak ditemukan.');
  });

  test('DELETE /api/posts/:id menolak hapus post milik pengguna lain', async () => {
    // Arrange
    const existing = makePost({ id: 5, user_id: 22 });
    Post.findByPk.mockResolvedValue(existing);

    // Act
    const response = await request(app).delete('/api/posts/5');

    // Assert
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Unauthorized.');
    expect(existing.destroy).not.toHaveBeenCalled();
  });
});
