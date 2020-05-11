const { UserInputError, AuthenticationError } = require('apollo-server');

const Post = require('../../models/Post');
const checkAuth = require('../../util/checkAuth');

module.exports = {
  Mutation: {
    async createComment(_, { postId, body }, context) {
      const { username } = checkAuth(context);

      if (body.trim() === '') {
        throw new UserInputError('Empty comment', {
          errors: {
            body: 'Comment body must not be empty',
          },
        });
      }

      // // validate user data
      // const { errors, valid } = validateLoginInput(email, password);
      // if (!valid) {
      //   throw new UserInputError('Errors: ', { errors });
      // }

      const post = await Post.findById(postId);

      if (post) {
        // unshift - adds new comment to the top
        post.comments.unshift({
          body,
          username,
          createdAt: new Date().toISOString(),
        });
        await post.save();
        return post;
      } else throw new UserInputError('Post not found');
    },

    async deleteComment(_, { postId, commentId }, context) {
      const { username } = checkAuth(context);

      const post = await Post.findById(postId);

      // // validate user data
      // const { errors, valid } = validateLoginInput(email, password);
      // if (!valid) {
      //   throw new UserInputError('Errors: ', { errors });
      // }

      if (post) {
        const commentIndex = post.comments.findIndex(
          (comment) => comment.id === commentId
        );

        if (commentIndex !== -1) {
          if (post.comments[commentIndex].username === username) {
            post.comments.splice(commentIndex, 1);
            await post.save();
            return post;
          } else {
            throw new AuthenticationError('Action not allowed!');
          }
        } else {
          throw new UserInputError('Comment not found');
        }
      }
    },
  },
};
