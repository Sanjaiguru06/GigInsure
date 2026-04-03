# Auth Testing Playbook - GigInsure

## Step 1: MongoDB Verification
```bash
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique), login_attempts.identifier

## Step 2: API Testing
```bash
# Login as admin
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@giginsure.com","password":"admin123"}'

# Check cookies
cat cookies.txt

# Get current user
curl -b cookies.txt http://localhost:8001/api/auth/me

# Register test rider
curl -c cookies.txt -X POST http://localhost:8001/api/auth/register -H "Content-Type: application/json" -d '{"email":"rider@test.com","password":"rider123","name":"Test Rider","city":"Chennai"}'

# Get pricing
curl -b cookies.txt -X POST http://localhost:8001/api/pricing -H "Content-Type: application/json" -d '{"city":"Chennai"}'
```

## Credentials
- Admin: admin@giginsure.com / admin123
- Test Rider: rider@test.com / rider123
