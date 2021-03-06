const path = require('path');
const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializenotes = note => ({
  id: note.id,
  name: xss(note.name),
  content: xss(note.content),
  modified: note.modified,
  folder_id: note.folder_id
});

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    NotesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializenotes));
      })
      .catch(next);
  })

  .post(jsonParser, (req, res, next) => {
    const { name, modified, folder_id, content } = req.body;
    if (name.length === 0 || content.length === 0) {
      return res.status(400).json({
        error: { message: `note name or content can not be empty` }
      });
    }
    const newNote = { name, modified, folder_id, content };

    for (const [key, value] of Object.entries(newNote))
      if (value === null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
    newNote.name = name;

    NotesService.insertNote(req.app.get('db'), newNote)
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializenotes(note));
      })
      .catch(next);
  });

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    NotesService.getById(req.app.get('db'), req.params.note_id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `note does not exist` }
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializenotes(res.note));
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get('db'), req.params.note_id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, modified, folder_id, content } = req.body;
    const noteToUpdate = { name, modified, folder_id, content };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          messsage: `Request body must contain 'name, modified, folderId, content'`
        }
      });
    NotesService.updateNote(req.app.get('db'), req.params.note_id, noteToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
