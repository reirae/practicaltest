// Q5: "UI testing over http" - checks the rendered pages are served correctly
// over the plain HTTP listener (port 8080), matching what the exam asks for.
const { expect } = require('chai');

const BASE_URL = process.env.APP_URL || 'http://localhost:8080';

describe('UI: pages load over http', () => {
  it('serves the home page with a login form', async () => {
    const res = await fetch(`${BASE_URL}/index.html`);
    const html = await res.text();
    expect(res.status).to.equal(200);
    expect(html).to.include('Login');
    expect(html).to.include('<form');
  });

  it('serves the signup page with a signup form', async () => {
    const res = await fetch(`${BASE_URL}/signup.html`);
    const html = await res.text();
    expect(res.status).to.equal(200);
    expect(html).to.include('Create Account');
  });

  it('serves the welcome page', async () => {
    const res = await fetch(`${BASE_URL}/welcome.html?user=test&pwd=test`);
    expect(res.status).to.equal(200);
  });
});
