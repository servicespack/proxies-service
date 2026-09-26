import type { Collection } from 'mongodb';

import { getMongoDb } from '@/config/mongodb.js';
import { ProxyEntity } from '@/domain/entities/proxy.entity.js';
import type { ProxyRepository } from '@/domain/repositories/proxy.repository.js';

export interface MongoProxyDocument {
  _id: string;
  namespace: string;
  target: string;
  cacheTtl?: number;
  createdAt: string;
}

export class MongoDbProxyRepository implements ProxyRepository {
  private readonly collectionInstance?: Collection<MongoProxyDocument>;

  constructor(collection?: Collection<MongoProxyDocument>) {
    this.collectionInstance = collection;
  }

  private get collection(): Collection<MongoProxyDocument> {
    return this.collectionInstance ?? getMongoDb().collection<MongoProxyDocument>('proxies');
  }

  private toEntity(doc: MongoProxyDocument): ProxyEntity {
    return new ProxyEntity({
      id: doc._id,
      namespace: doc.namespace,
      target: doc.target,
      cacheTtl: doc.cacheTtl,
      createdAt: doc.createdAt,
    });
  }

  async findAll(): Promise<ProxyEntity[]> {
    const docs = await this.collection.find().toArray();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<ProxyEntity | undefined> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toEntity(doc) : undefined;
  }

  async findByNamespace(namespace: string): Promise<ProxyEntity | undefined> {
    const doc = await this.collection.findOne({ namespace });
    return doc ? this.toEntity(doc) : undefined;
  }

  async create(proxy: ProxyEntity): Promise<ProxyEntity> {
    await this.collection.insertOne({
      _id: proxy.id,
      namespace: proxy.namespace,
      target: proxy.target,
      cacheTtl: proxy.cacheTtl,
      createdAt: proxy.createdAt,
    });
    return proxy;
  }

  async update(id: string, proxyData: Partial<ProxyEntity>): Promise<ProxyEntity | undefined> {
    const { id: _ignoredId, ...fieldsToUpdate } = proxyData;
    const doc = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: fieldsToUpdate },
      { returnDocument: 'after' },
    );
    return doc ? this.toEntity(doc) : undefined;
  }

  async delete(id: string): Promise<ProxyEntity | undefined> {
    const doc = await this.collection.findOneAndDelete({ _id: id });
    return doc ? this.toEntity(doc) : undefined;
  }
}
