const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./folders.fixtures');
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures');

describe('Notes Endpoints', function() {
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

  describe.only(`GET /api/notes`, () => {
    context(`no notes`, () => {
      it(`responds with 200 and empty list`, () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, []);
      });
    });
    context(`notes in the database`, () => {
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
      it('responds with 200 and all of notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes);
      });
    });
  });
  describe(`GET /api/notes/:notes_id`, () => {
    context(`given notes`, () => {
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
      it(`responts with 200`, () => {
        const noteId = 1;
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(200, testNotes[0]);
      });
    });
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteId = 99999;
        return supertest(app)
          .get(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `note does not exist` } });
      });
    });
  });

  describe(`POST /api/notes`, () => {
    context(`no notes`, () => {
      it(`responds with 200 and empty list on post`, () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, []);
      });
    });
    context(`notes in the database`, () => {
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
      it('responds with 200 and all of notes', () => {
        const newNote = {
          name: 'test',
          modified: '2019-01-03T00:00:00.000Z',
          folder_id: 15,
          content: 'ruaaaaaaaaaaaaaa'
        };
        return supertest(app)
          .post('/api/notes')
          .send(newNote)
          .expect(201)
          .expect(res => {
            expect(res.body.name).to.eql(newNote.name);
            expect(res.body.folder_id).to.eql(newNote.folder_id);
            expect(res.body.modified).to.eql(newNote.modified);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
          })
          .then(res => {
            supertest(app)
              .get(`/api/notes/${res.body.id}`)
              .expect(res.body);
          });
      });
    });
  });

  describe(`PATCH /api/notes/:notes_id`, () => {
    context(`Given no notes`, () => {
      it(`responds 404`, () => {
        const noteId = 1;
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `note does not exist` } });
      });
    });
    context(`Given no notes in database`, () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();

      beforeEach(`insert notes`, () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert(testNotes);
          });
      });
      it('responds with 204 and updates notes', () => {
        const idToUpdate = 2;
        const updateNote = {
          name: 'test',
          modified: '2019-01-03T00:00:00.000Z',
          folder_id: 2,
          content: 'ruaaaaaaaaaaaaaa'
        };
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updateNote
        };
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updateNote)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(expectedNote)
          );
      });
    });
  });
  describe.only(`DELETE /api/notes/:note_id`, () => {
    context(`Given no articles`, () => {
      it(`responds with 404`, () => {
        const noteId = 3;
        return supertest(app)
          .delete(`/api/notes/${noteId}`)
          .expect(404, { error: { message: `note does not exist` } });
      });
    });
    context('Given there are folders in the database', () => {
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

      it('responds with 204 and removes the note', () => {
        const idToRemove = 1;
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove);
        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/notes`)
              .expect(expectedNotes)
          );
      });
    });
  });
});

/*
    context(`Given an XSS  attack note`, () => {
      const testNotes = makeNotesArray();
      const { maliciousNote, expectedNote } = makeMaliciousNote();

      beforeEach('insert malicious note', () => {
        return db
          .into('noteful_folders')
          .insert(testFolders)
          .then(() => {
            return db.into('noteful_notes').insert([maliciousNote]);
          });
      });
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNote.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedNote.name);
            expect(res.body.content).to.eql(expectedNote.content);
          });
      });
    });*/
