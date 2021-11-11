// Function that finds existing email
const findEmail = (email, dbUsers) => {
  for (const user in dbUsers) {
    if (dbUsers[user].email === email) {
      return dbUsers[user];
    }
  }

  return undefined;
};

module.exports = {
  findEmail,
};