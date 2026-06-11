const bcrypt = require('bcryptjs');

// Test password verification
const password = 'password123';
const hash = '$2a$10$rXQd8HJB1gs1YbeL2J3TUeFjTHzF6Q1KQF0JGgG0H1lHZFGQ0q5Im';

bcrypt.compare(password, hash)
    .then(result => {
        console.log('========================================');
        console.log('Password Test Result:', result ? 'VALID ✓' : 'INVALID ✗');
        console.log('========================================');

        if (!result) {
            console.log('\nGenerating NEW working hash...');
            return bcrypt.hash(password, 10);
        }
    })
    .then(newHash => {
        if (newHash) {
            console.log('\nNEW HASH for password123:');
            console.log(newHash);
            console.log('\nUse this hash in your SQL!');
            console.log('========================================');
        }
    })
    .catch(err => console.error('Error:', err));
