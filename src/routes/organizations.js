const express = require("express");

/**
 * Build the organizations router.
 *
 * @param {Object} deps
 * @param {ReturnType<import("../service/organizationService").createOrganizationService>} deps.organizationService
 * @returns {import("express").Router}
 */
function createOrganizationsRouter({ organizationService }) {
  const router = express.Router();

  router.post("/", (req, res, next) => {
    try {
      const organization = organizationService.createOrganization(req.body);
      res.status(201).json(organization);
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", (req, res, next) => {
    try {
      const organization = organizationService.replaceOrganization(req.params.id, req.body);
      res.status(200).json(organization);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createOrganizationsRouter };
