const { test } = require('node:test');
const assert = require('node:assert');

const { hashPassword, comparePassword } = require('../src/utils/password');

test('hashPassword generates a different value than the plain text input', async (t) => {
  const plain = 's3cret';
  const hashed = await hashPassword(plain);

  assert.notStrictEqual(hashed, plain, 'Hashed password should differ from the plain text value');
  assert.ok(hashed.startsWith('$2a$') || hashed.startsWith('$2b$'));
});

test('comparePassword correctly validates a password against its hash', async (t) => {
  const plain = 'anotherSecret';
  const hashed = await hashPassword(plain);

  assert.strictEqual(await comparePassword(plain, hashed), true);
  assert.strictEqual(await comparePassword('wrong-password', hashed), false);
});