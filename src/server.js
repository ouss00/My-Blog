import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app=express();

app.use(express.static(path.join(__dirname,'/build')));

const withdb = async (operations,res) => {

	try {
		const client = await MongoClient.connect('mongodb://localhost:27017',{ useNewUrlParser :true });
		const db = client.db('my-blog');
		

		await operations(db);
		client.close();
	} catch (error) {
		res.status(500).json({message : "error " ,error});

	}
};



app.use(bodyParser.json());


// connect with mongo db 
app.get('/api/articles/:name' , async (req , res) => {

	withdb(async (db) => {

		const articleName = req.params.name;
		const articleInfo = await db.collection('articles').findOne({name:articleName});


		res.status(200).json(articleInfo);

		},res);
});

//app.get('/hello/:name',(req,res) => res.send(`Hello ${req.params.name}`));
//app.post('/hello',(req,res) => res.send(`Hello ${req.body.name} !`));

// upvote ++
app.post('/api/articles/:name/upvote',async (req,res) => {

		withdb(async (db) => {

			const articleName = req.params.name;
			const articleInfo = await db.collection('articles').findOne({name:articleName});

			await db.collection('articles').updateOne({ name : articleName },{
						'$set' : {
					upvotes : articleInfo.upvotes+1,
				},
			});
			const updateArticleInfo = await db.collection('articles').findOne({name:articleName});
			res.status(200).json(updateArticleInfo);

		},res);
});
// add comment post
app.post('/api/articles/:name/add-comment',(req,res) => {
	//const comment = req.body.comment;

	const articleName = req.params.name;
	const {username,text} = req.body
	withdb(async (db) => {

		const articleInfo = await db.collection('articles').findOne({name:articleName});
		await db.collection('articles').updateOne({ name : articleName },{
					'$set' : {
				comments : articleInfo.comments.concat({username,text}),
			},
		});
		const updateArticleInfo = await db.collection('articles').findOne({name:articleName});
		res.status(200).json(updateArticleInfo);

		},res);
});

app.get('*',(req,res) => {

	res.sendFile(path.join(__dirname+'/build/index.html'));

});

app.listen(4000 , () => console.log('Listenning on port 8000'));