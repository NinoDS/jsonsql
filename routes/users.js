const express = require('express');
const router = express.Router();
const JSONDatabase = require('../JSONDatabase');
const users = new JSONDatabase({ fileName: 'users', data: [] });

router.post('/check', (req, res) => {
	const { username, password } = req.body;
	console.log(users.data());
	for (const user of users.data()) {
		if (user.username === username && user.password === password) {
			res.send({
				success: true,
				user: user
			});
			return;
		}
	}
	res.send({
		success: false
	});
});

const app = express();
app.use(express.json());
app.use(router);
app.listen(3000);
console.log('Server running on port 3000');