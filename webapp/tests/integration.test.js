const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');

describe('Integration: signup flow', () => {
  it('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/validate-password')
      .send({ username: 'alice', password: 'ab1' });
    expect(res.body.valid).to.equal(false);
  });

  it('rejects a common password', async () => {
    const res = await request(app)
      .post('/api/validate-password')
      .send({ username: 'alice', password: '123456' });
    expect(res.body.valid).to.equal(false);
  });

  it('accepts a long, non-common password', async () => {
    const res = await request(app)
      .post('/api/validate-password')
      .send({ username: 'alice', password: 'correct-horse-battery-staple-9382' });
    expect(res.body.valid).to.equal(true);
  });

  it('redirects to welcome.html on a valid signup', async () => {
    const res = await request(app)
      .post('/signup')
      .send({ username: 'bob-test-user', password: 'a-very-unique-passphrase-472913' });
    expect(res.status).to.equal(302);
    expect(res.headers.location).to.include('welcome.html');
  });

  it('redirects back to index.html on an invalid signup', async () => {
    const res = await request(app)
      .post('/signup')
      .send({ username: 'carol', password: 'password' });
    expect(res.status).to.equal(302);
    expect(res.headers.location).to.include('index.html');
  });
});
