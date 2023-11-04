"use strict";

module.exports = {
    /**
     * Get all available proposals
     *
     * @params none
     * @body none
     * @returns { proposals: [ { id: number, title: string, description: string, author: string, ... } ] }
     * @error 401 Unauthorized - if the user is not logged in
     * @error 500 Internal Server Error - if something went wrong
     */
    getAllProposals: async (req, res) => {
        // TODO: this is an example made for tests purposes only, change it
        const proposals = [
            {
                id: 1,
                title: "Proposal 1",
                description: "Description 1"
            },
            {
                id: 2,
                title: "Proposal 2",
                description: "Description 2"
            }
            ];

        try {
            res.status(200).json({ proposals });
        } catch (err) {
            console.error("[BACKEND-SERVER] Cannot get proposals", err);
            res.status(500).json({ error: "Internal server error has occurred" });
        }
    }
}