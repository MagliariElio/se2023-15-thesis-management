'use strict';

/**
 * Passed model
 */
module.exports = function Passed(id = -1, career_id = '', student_id = '') {
  this.id = id;
  this.career_id = career_id;
  this.student_id = student_id;
};