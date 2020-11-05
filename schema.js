const fetch = require('node-fetch');
const util = require('util');
const parseXML = util.promisify(require('xml2js').parseString);
const { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList } = require('graphql');

const BookType = new GraphQLObjectType({
	name: 'Book',
	description: '...',

	fields: () => ({
		title: {
			type: GraphQLString,
			resolve: xml => xml.title[0]
		},
		isbn: {
			type: GraphQLString,
			resolve: xml => {
				const isbn = xml.isbn[0];
				return typeof isbn === 'string' ? isbn : null;
			}
		}
	})
});

const AuthorType = new GraphQLObjectType({
	name: 'Author',
	description: '...',

	fields: () => ({
		name: {
			type: GraphQLString,
			resolve: xml => xml.GoodreadsResponse.author[0].name[0]
		},
		lived: {
			type: GraphQLString,
			resolve: xml => {
				const formatDate = dateString => {
					if (dateString) {
						const options = { year: 'numeric', month: 'long', day: 'numeric' };
						const date = new Date(dateString);
						return date.toLocaleDateString('en-us', options);
					} else {
						return '?';
					}
				};

				const author = xml.GoodreadsResponse.author[0];
				const birth = author.born_at[0];
				const died = author.died_at[0];

				const parts = [formatDate(birth), '-', formatDate(died)];
				return parts.join(' ');
			}
		},
		books: {
			type: new GraphQLList(BookType),
			resolve: xml => xml.GoodreadsResponse.author[0].books[0].book
		}
	})
});

module.exports = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		description: 'Query to get author information',
		fields: () => ({
			author: {
				type: AuthorType,
				args: {
					id: { type: GraphQLInt }
				},
				resolve: (root, args) =>
					fetch(`https://www.goodreads.com/author/show.xml?id=${args.id}&key=DE9CV2N7UymzU0l4QZVZcg`)
						.then(response => response.text())
						.then(parseXML)
			}
		})
	})
});
