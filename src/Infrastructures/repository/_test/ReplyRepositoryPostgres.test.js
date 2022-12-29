const pool = require('../../database/postgres/pool');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CreateReply = require('../../../Domains/replies/entities/CreateReply');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('createReply function', () => {
    it('should persist create reply and return created reply correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' }); // add user with id user-123
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' }); // add thread with id thread-123
      await CommentsTableTestHelper.addComment({ id: 'comment-123' }); // add comment with id comment-123
      const createReply = new CreateReply({
        content: 'Reply content',
        owner: 'user-123',
        commentId: 'comment-123',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const createdReply = await replyRepositoryPostgres.createReply(createReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById(createdReply.id);
      expect(replies).toHaveLength(1);
    });
  });

  describe('verifyReplyIsExist function', () => {
    it('should throw NotFoundError when reply not found', () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      return expect(replyRepositoryPostgres.verifyReplyIsExist('hello-world'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply found', async () => {
      // Arrange
      const replyId = 'reply-123';
      await UsersTableTestHelper.addUser({ id: 'user-123' }); // add user with id user-123
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' }); // add thread with id thread-123
      await CommentsTableTestHelper.addComment({ id: 'comment-123' }); // add comment with id comment-123
      await RepliesTableTestHelper.addReply({ id: replyId }); // add reply with id reply-123
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      return expect(replyRepositoryPostgres.verifyReplyIsExist(replyId))
        .resolves
        .not
        .toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw UnauthorizedError when provided userId is not the reply owner', async () => {
      // Arrange
      const commentId = 'comment-123';
      const replyId = 'reply-123';
      const userId = 'user-123';
      const wrongUserId = 'user-456';
      await UsersTableTestHelper.addUser({ id: userId }); // add user with id user-123
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' }); // add thread with id thread-123
      await CommentsTableTestHelper.addComment({ id: commentId }); // add comment with id comment-123
      await RepliesTableTestHelper.addReply({ id: replyId, owner: userId, commentId }); // add reply with id reply-123
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      expect(replyRepositoryPostgres.verifyReplyOwner(replyId, wrongUserId))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should verify the reply owner correctly', async () => {
      // Arrange
      const commentId = 'comment-123';
      const replyId = 'reply-123';
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId }); // add user with id user-123
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' }); // add thread with id thread-123
      await CommentsTableTestHelper.addComment({ id: commentId }); // add comment with id comment-123
      await RepliesTableTestHelper.addReply({ id: replyId, owner: userId, commentId }); // add reply with id reply-123
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      expect(replyRepositoryPostgres.verifyReplyOwner(replyId, userId))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteReplyById function', () => {
    it('should throw NotFoundError when reply not found', () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      return expect(replyRepositoryPostgres.deleteReplyById('hello-world'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should delete reply by id and return success correctly', async () => {
      // Arrange
      const commentId = 'comment-123';
      const replyId = 'reply-123';
      await UsersTableTestHelper.addUser({ id: 'user-123' }); // add user with id user-123
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' }); // add thread with id thread-123
      await CommentsTableTestHelper.addComment({ id: commentId }); // add comment with id comment-123
      await RepliesTableTestHelper.addReply({ id: replyId, owner: 'user-123', commentId }); // add reply with id reply-123
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReplyById(replyId);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById(replyId);
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });
  });
});