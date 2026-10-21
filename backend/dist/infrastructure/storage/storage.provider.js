"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnconfiguredStorageProvider = exports.STORAGE_PROVIDER = void 0;
exports.STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
/** Storage contract placeholder; configure a local or cloud adapter before uploads. */
class UnconfiguredStorageProvider {
    async put(_key, _content, _contentType) {
        throw new Error('No storage provider is configured');
    }
    async remove(_key) {
        throw new Error('No storage provider is configured');
    }
}
exports.UnconfiguredStorageProvider = UnconfiguredStorageProvider;
