const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');
const { makeNotesArray } = require('./notes.fixtures');

describe('Folders Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () =>
    db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE')
  );

  afterEach('cleanup', () =>
    db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE')
  );

  describe(`GET /api/folders`, () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });
    context(`folders in the database`, () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert notes', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });
      it('responds with 200 and all of folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders);
      });
    });
  });

  describe(`GET /api/folders/:folders_id`, () => {
    context(`Given no folders`, () => {
      it(`responds 404 no folders`, () => {
        const folderId = 9999;
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `folder doesnt exist` } });
      });
    });
    context('Given there are folders in the database', () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert articles', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });

      it('responds with 200 and the specified folder', () => {
        const folderId = 2;
        const expectedFolder = testFolders[folderId - 1];
        return supertest(app)
          .get(`/api/folders/${folderId}`)
          .expect(200, expectedFolder);
      });
    });
  });

  describe(`POST /api/folders`, () => {
    const testFolders = makeFoldersArray();
    beforeEach('insert folder', () => {
      return db.into('noteful_folders').insert(testFolders);
    });
  });

  describe(`DELETE /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderId = 9999;
        return supertest(app)
          .delete(`/api/folders/${folderId}`)
          .expect(404, { error: { message: `folder doesnt exist` } });
      });
    });
    context('Given there are articles in the database', () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach('insert articles', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });
      it('responds with 204 and removes the folder', () => {
        const idToRemove = 2;
        const expectedFolders = testFolders.filter(
          folder => folder.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/folders`)
              .expect(expectedFolders)
          );
      });
    });
  });
});
