const APIConfig = require('./config.json');

const ProposalsAPIURL = APIConfig.API_URL + '/proposals';

/**
 * Interface for the Proposals API
 * Route /api/proposals
 */

module.exports = {

    /**
     * Get all proposals
     *
     * GET /api/proposals
     *
     * @params: none
     * @body: none
     * @returns: { proposals: [ { id: number, title: string, description: string, author: string, creationDate: string, status: string, ... } ] }
     * @error: 500 Internal Server Error - if something went wrong
     */
    getAllProposals: async () => {
        return fetch(ProposalsAPIURL, {
            method: 'GET',
            headers: APIConfig.API_REQUEST_HEADERS
        });
    }
}