import bcrypt from 'bcryptjs';

const testHash = async () => {
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Bcryptjs generated hash:', hash);

  const predefinedHash = '$2a$10$vK3t/0qYn9rW3Mv9hM4Ueu7cpeqPZ.O3PzT9MwqK7m4hE07L91V6y';
  const isMatch = await bcrypt.compare(password, predefinedHash);
  console.log('Does predefined hash match password123?:', isMatch);
};

testHash();
