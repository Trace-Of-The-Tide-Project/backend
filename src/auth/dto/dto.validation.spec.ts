import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SignupDto } from './signup.dto';
import { LoginDto } from './login.dto';

describe('SignupDto', () => {
  function createDto(overrides: Partial<SignupDto> = {}): SignupDto {
    return plainToInstance(SignupDto, {
      username: 'testuser',
      email: 'test@trace.ps',
      password: 'Test@1234',
      ...overrides,
    });
  }

  it('should validate successfully with all required fields', async () => {
    const dto = createDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should validate with optional fields included', async () => {
    const dto = createDto({
      full_name: 'Test User',
      phone_number: '+970591234567',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when username is missing', async () => {
    const dto = createDto({ username: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'username')).toBe(true);
  });

  it('should fail when email is invalid', async () => {
    const dto = createDto({ email: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail when email is missing', async () => {
    const dto = createDto({ email: '' as any });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail when password is too short', async () => {
    const dto = createDto({ password: '1234567' }); // 7 chars, needs 8
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should fail when password is missing', async () => {
    const dto = createDto({ password: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept password with exactly 8 characters', async () => {
    const dto = createDto({ password: '12345678' });
    const errors = await validate(dto);
    const pwErrors = errors.filter((e) => e.property === 'password');
    expect(pwErrors).toHaveLength(0);
  });
});

describe('LoginDto', () => {
  function createDto(overrides: Partial<LoginDto> = {}): LoginDto {
    return plainToInstance(LoginDto, {
      email: 'test@trace.ps',
      password: 'Test@1234',
      ...overrides,
    });
  }

  it('should validate successfully with valid email and password', async () => {
    const dto = createDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail when email is invalid', async () => {
    const dto = createDto({ email: 'invalid' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should accept any non-empty password (length validation is on signup, not login)', async () => {
    const dto = createDto({ password: 'short' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(false);
  });

  it('should fail when password is empty', async () => {
    const dto = createDto({ password: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
