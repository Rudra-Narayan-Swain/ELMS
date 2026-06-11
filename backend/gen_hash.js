const bcrypt = require('bcryptjs');

console.log('\n========================================');
console.log('Generating bcrypt hash for: password123');
console.log('========================================\n');

bcrypt.hash('password123', 10)
    .then(hash => {
        console.log('SUCCESS! Copy this hash:\n');
        console.log(hash);
        console.log('\n========================================\n');
    })
    .catch(err => {
        console.error('Error:', err);
    });
