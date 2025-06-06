export const transformId = doc => {
    if (!doc) {
        return doc;
    }

    if (Array.isArray(doc)) {
        return doc.map(item => ({
            ...item,
            id: item._id.toString(),
        }));
    }

    return {
        ...doc,
        id: doc._id.toString(),
    };
};
