const express = require("express");

const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE"];

/**
 * Build the office tables router.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../service/officeTableService").createOfficeTableService>} deps.officeTableService
 * @returns {import("express").Router}
 */
function createOfficeTablesRouter({ officeTableService }) {
  const router = express.Router();

  router
    .route("/")
    .post((req, res, next) => {
      try {
        const table = officeTableService.createOfficeTable(req.body);
        res.status(201).json(table);
      } catch (err) {
        next(err);
      }
    })
    .get((req, res, next) => {
      try {
        const { items, nextCursor } = officeTableService.listOfficeTables({
          cursor: req.query.cursor,
          limit: req.query.limit,
        });

        if (nextCursor) {
          res.setHeader("X-Next-Cursor", nextCursor);
        }

        res.status(200).json(items);
      } catch (err) {
        next(err);
      }
    })
    .all((req, res) => {
      res.setHeader("Allow", "GET, POST");
      res.status(405).json({ error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
    });

  router
    .route("/:id")
    .get((req, res, next) => {
      try {
        const table = officeTableService.getOfficeTable(req.params.id);
        res.status(200).json(table);
      } catch (err) {
        next(err);
      }
    })
    .put((req, res, next) => {
      try {
        const table = officeTableService.replaceOfficeTable(req.params.id, req.body);
        res.status(200).json(table);
      } catch (err) {
        next(err);
      }
    })
    .delete((req, res, next) => {
      try {
        officeTableService.deleteOfficeTable(req.params.id);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    })
    .all((req, res) => {
      res.setHeader("Allow", "GET, PUT, DELETE");
      res.status(405).json({ error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
    });

  return router;
}

module.exports = { createOfficeTablesRouter };
