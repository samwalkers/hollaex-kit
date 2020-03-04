'use strict';

const { Status } = require('../../db/models');
const { CONSTANTS_KEYS, INIT_CHANNEL, SECRETS_KEYS, SYSTEM_CONFIGURATION } = require('../../constants');
const { publisher } = require('../../db/pubsub');
const redis = require('../../db/redis').duplicate();

// Winston logger
const logger = require('../../config/logger').loggerPlugin;

const joinConstants = (statusConstants = {}, newConstants = {}) => {
	const joinedConstants = {
		secrets: {}
	};
	CONSTANTS_KEYS.forEach((key) => {
		if (key === 'secrets' && newConstants[key]) {
			SECRETS_KEYS.forEach((secretKey) => {
				joinedConstants[key][secretKey] = newConstants[key][secretKey] || statusConstants[key][secretKey];
			});
		}
		else {
			joinedConstants[key] = newConstants[key] || statusConstants[key];
		}
	});
	return joinedConstants;
};

const updateConstants = (constants) => {
	Status.findOne({
		attributes: ['id', 'constants']
	})
		.then((status) => {
			if (Object.keys(constants).length > 0) {
				constants = joinConstants(status.dataValues.constants, constants);
			}
			return status.update({ constants }, {
				fields: [
					'constants'
				],
				returning: true
			});
		})
		.then(async (data) => {
			const secrets = data.constants.secrets;
			await delete data.constants.secrets;
			await publisher.publish(
				INIT_CHANNEL,
				JSON.stringify({
					type: 'constants', data: { constants: data.constants, secrets }
				})
			);
			return { ...data.constants, secrets };
		});
};

const isUrl = (url) => {
	const pattern = /^(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)$/;
	return pattern.test(url);
};

const getConfiguration = () => {
	return redis.getAsync(SYSTEM_CONFIGURATION)
		.then((data) => {
			return JSON.parse(data);
		});
};

module.exports = {
	logger,
	updateConstants,
	getConfiguration,
	isUrl
};