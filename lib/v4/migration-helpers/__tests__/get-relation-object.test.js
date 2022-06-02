jest.mock('lodash', () => ({
  kebabCase: jest.fn(() => 'destination'),
}));

jest.mock('pluralize', () => ({
  singular: jest.fn(),
}));

const getRelationObject = require('../get-relation-object');

describe('migrate relations from v3 settings.json to v4 schema.json', () => {
  it('migrates oneToOne (oneWay)', () => {
    const v3HasOneDestination = {
      model: 'destination',
    };

    const v4Migration = getRelationObject('oneToOne', { ...v3HasOneDestination, inversed: false });

    const v4ExpectedHasOneDestination = {
      type: 'relation',
      relation: 'oneToOne',
      target: 'api::destination.destination',
    };

    expect(v4Migration).toEqual(v4ExpectedHasOneDestination);
  });

  it('migrates oneToOne', () => {
    const v3hasAndBelongsToOneDestination = {
      model: 'destination',
      via: 'origin',
    };

    const v4Migration = getRelationObject('oneToOne', {
      ...v3hasAndBelongsToOneDestination,
      inversed: true,
    });

    const v4hasAndBelongsToOneDestination = {
      type: 'relation',
      relation: 'oneToOne',
      target: 'api::destination.destination',
      inversedBy: 'origin',
    };

    expect(v4Migration).toEqual(v4hasAndBelongsToOneDestination);
  });

  it('migrates oneToMany', () => {
    const v3BelongsToManyDestinations = {
      collection: 'destination',
      via: 'origin',
    };

    const v4Migration = getRelationObject('oneToMany', {
      ...v3BelongsToManyDestinations,
      inversed: false,
    });

    const v4ExpectedBelongsToManyDestinations = {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::destination.destination',
      mappedBy: 'origin',
    };

    expect(v4Migration).toEqual(v4ExpectedBelongsToManyDestinations);
  });

  it('migrates manyToOne', () => {
    const v3HasManyOrigins = {
      model: 'destination',
      via: 'origins',
    };

    const v4Migration = getRelationObject('manyToOne', { ...v3HasManyOrigins, inversed: true });

    const v4ExpectedHasManyOrigins = {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::destination.destination',
      inversedBy: 'origins',
    };

    expect(v4Migration).toEqual(v4ExpectedHasManyOrigins);
  });

  it('migrates manyToMany', () => {
    const v3HasAndBelongsToManyDestinations = {
      collection: 'destination',
      via: 'origins',
      dominant: true,
    };

    const v4Migration = getRelationObject('manyToMany', {
      ...v3HasAndBelongsToManyDestinations,
      inversed: v3HasAndBelongsToManyDestinations.dominant,
    });

    const v4ExpectedHasAndBelongsToManyDestinations = {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::destination.destination',
      inversedBy: 'origins',
    };

    expect(v4Migration).toEqual(v4ExpectedHasAndBelongsToManyDestinations);
  });

  it('migrates oneToMany', () => {
    const v3HasManyDestinations = {
      collection: 'destination',
    };

    const v4Migration = getRelationObject('oneToMany', {
      ...v3HasManyDestinations.collection,
      inversed: false,
    });

    const v4ExpectedHasManyDestinations = {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::destination.destination',
    };

    expect(v4Migration).toEqual(v4ExpectedHasManyDestinations);
  });
});
