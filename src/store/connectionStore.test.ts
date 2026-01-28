import { describe, it, expect, beforeEach } from 'vitest';
import { useConnectionStore, createConnectionStore } from './connectionStore';
import { ConnectionState } from '../lib/jellyfin-apiclient/connectionState';

describe('connectionStore', () => {
    beforeEach(() => {
        useConnectionStore.setState({
            currentState: ConnectionState.ServerSelection,
            webSocketState: 'idle',
            webSocketConnectedAt: undefined,
            webSocketError: undefined,
            currentServerId: undefined,
            currentApiClient: null,
            availableServers: [],
            currentUserId: undefined,
            connectionAttempts: [],
            lastError: undefined,
            metrics: {
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                averageConnectionTime: 0,
                lastConnectionTime: undefined,
                lastError: undefined
            }
        });
    });

    describe('initial state', () => {
        it('should have default connection state', () => {
            const state = useConnectionStore.getState();
            expect(state.currentState).toBe(ConnectionState.ServerSelection);
        });

        it('should have idle websocket state', () => {
            const state = useConnectionStore.getState();
            expect(state.webSocketState).toBe('idle');
        });

        it('should have empty servers list', () => {
            const state = useConnectionStore.getState();
            expect(state.availableServers).toEqual([]);
        });

        it('should have no current API client', () => {
            const state = useConnectionStore.getState();
            expect(state.currentApiClient).toBeNull();
        });

        it('should have empty connection attempts', () => {
            const state = useConnectionStore.getState();
            expect(state.connectionAttempts).toEqual([]);
        });

        it('should have zero metrics', () => {
            const state = useConnectionStore.getState();
            expect(state.metrics.totalAttempts).toBe(0);
            expect(state.metrics.successfulAttempts).toBe(0);
            expect(state.metrics.failedAttempts).toBe(0);
        });
    });

    describe('setCurrentState', () => {
        it('should set connection state', () => {
            useConnectionStore.getState().setCurrentState(ConnectionState.SignedIn);
            expect(useConnectionStore.getState().currentState).toBe(ConnectionState.SignedIn);
        });
    });

    describe('WebSocket state management', () => {
        it('should set websocket state to connecting', () => {
            useConnectionStore.getState().setWebSocketState('connecting');
            expect(useConnectionStore.getState().webSocketState).toBe('connecting');
        });

        it('should set websocket connected timestamp', () => {
            const beforeTime = Date.now();
            useConnectionStore.getState().setWebSocketState('connected');
            const state = useConnectionStore.getState();

            expect(state.webSocketState).toBe('connected');
            expect(state.webSocketConnectedAt).toBeDefined();
            expect(state.webSocketConnectedAt!).toBeGreaterThanOrEqual(beforeTime);
        });

        it('should clear websocket timestamp on disconnect', () => {
            useConnectionStore.getState().setWebSocketState('connected');
            useConnectionStore.getState().setWebSocketState('disconnected');

            const state = useConnectionStore.getState();
            expect(state.webSocketState).toBe('disconnected');
            expect(state.webSocketConnectedAt).toBeUndefined();
        });

        it('should set error state', () => {
            useConnectionStore.getState().setWebSocketState('error');
            const state = useConnectionStore.getState();

            expect(state.webSocketState).toBe('error');
            expect(state.webSocketError).toBeDefined();
        });
    });

    describe('server management', () => {
        it('should set current server ID', () => {
            useConnectionStore.getState().setCurrentServerId('server-123');
            expect(useConnectionStore.getState().currentServerId).toBe('server-123');
        });

        it('should clear server ID', () => {
            useConnectionStore.getState().setCurrentServerId('server-123');
            useConnectionStore.getState().setCurrentServerId(undefined);
            expect(useConnectionStore.getState().currentServerId).toBeUndefined();
        });

        it('should set available servers', () => {
            const servers = [
                { Id: '1', Name: 'Server 1', Address: 'http://localhost' },
                { Id: '2', Name: 'Server 2', Address: 'http://192.168.1.1' }
            ] as any;
            useConnectionStore.getState().setAvailableServers(servers);

            expect(useConnectionStore.getState().availableServers).toEqual(servers);
        });

        it('should set API client', () => {
            const mockClient = { ServerAddress: 'http://localhost' } as any;
            useConnectionStore.getState().setCurrentApiClient(mockClient);
            expect(useConnectionStore.getState().currentApiClient).toBe(mockClient);
        });

        it('should clear API client', () => {
            const mockClient = { ServerAddress: 'http://localhost' } as any;
            useConnectionStore.getState().setCurrentApiClient(mockClient);
            useConnectionStore.getState().setCurrentApiClient(null);
            expect(useConnectionStore.getState().currentApiClient).toBeNull();
        });
    });

    describe('user context', () => {
        it('should set current user ID', () => {
            useConnectionStore.getState().setCurrentUserId('user-456');
            expect(useConnectionStore.getState().currentUserId).toBe('user-456');
        });

        it('should clear user ID', () => {
            useConnectionStore.getState().setCurrentUserId('user-456');
            useConnectionStore.getState().setCurrentUserId(undefined);
            expect(useConnectionStore.getState().currentUserId).toBeUndefined();
        });
    });

    describe('connection attempts', () => {
        it('should add successful connection attempt', () => {
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 150,
                result: 'success'
            });

            const state = useConnectionStore.getState();
            expect(state.connectionAttempts).toHaveLength(1);
            expect(state.connectionAttempts[0].result).toBe('success');
            expect(state.metrics.successfulAttempts).toBe(1);
            expect(state.metrics.totalAttempts).toBe(1);
        });

        it('should add failed connection attempt', () => {
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Connection timeout'
            });

            const state = useConnectionStore.getState();
            expect(state.connectionAttempts).toHaveLength(1);
            expect(state.connectionAttempts[0].result).toBe('failure');
            expect(state.metrics.failedAttempts).toBe(1);
            expect(state.lastError).toBe('Connection timeout');
        });

        it('should calculate average connection time for successful attempts', () => {
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 200,
                result: 'success'
            });

            const state = useConnectionStore.getState();
            expect(state.metrics.averageConnectionTime).toBe(150);
        });

        it('should ignore failed attempts in average calculation', () => {
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Timeout'
            });

            const state = useConnectionStore.getState();
            expect(state.metrics.averageConnectionTime).toBe(100);
            expect(state.metrics.failedAttempts).toBe(1);
        });

        it('should limit connection history to 50 items', () => {
            for (let i = 0; i < 60; i++) {
                useConnectionStore.getState().addConnectionAttempt({
                    serverId: 'server-1',
                    serverName: 'My Server',
                    timestamp: Date.now(),
                    duration: 100,
                    result: 'success'
                });
            }

            const state = useConnectionStore.getState();
            expect(state.connectionAttempts).toHaveLength(50);
        });

        it('should clear connection history', () => {
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            useConnectionStore.getState().clearConnectionHistory();
            expect(useConnectionStore.getState().connectionAttempts).toEqual([]);
        });
    });

    describe('error management', () => {
        it('should set last error', () => {
            useConnectionStore.getState().setLastError('Connection failed');
            expect(useConnectionStore.getState().lastError).toBe('Connection failed');
        });

        it('should clear error', () => {
            useConnectionStore.getState().setLastError('Connection failed');
            useConnectionStore.getState().setLastError(undefined);
            expect(useConnectionStore.getState().lastError).toBeUndefined();
        });
    });

    describe('metrics management', () => {
        it('should update metrics', () => {
            useConnectionStore.getState().updateMetrics({
                totalAttempts: 5,
                successfulAttempts: 4
            });

            const state = useConnectionStore.getState();
            expect(state.metrics.totalAttempts).toBe(5);
            expect(state.metrics.successfulAttempts).toBe(4);
        });

        it('should partially update metrics', () => {
            useConnectionStore.getState().updateMetrics({ averageConnectionTime: 250 });

            const state = useConnectionStore.getState();
            expect(state.metrics.averageConnectionTime).toBe(250);
            expect(state.metrics.totalAttempts).toBe(0);
        });
    });

    describe('reset', () => {
        it('should reset to initial state', () => {
            useConnectionStore.getState().setCurrentState(ConnectionState.SignedIn);
            useConnectionStore.getState().setCurrentServerId('server-1');
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            useConnectionStore.getState().reset();

            const state = useConnectionStore.getState();
            expect(state.currentState).toBe(ConnectionState.ServerSelection);
            expect(state.currentServerId).toBeUndefined();
            expect(state.connectionAttempts).toEqual([]);
            expect(state.metrics.totalAttempts).toBe(0);
        });
    });

    describe('createConnectionStore factory', () => {
        it('should create store with custom initial state', () => {
            const customStore = createConnectionStore({
                currentState: ConnectionState.SignedIn,
                currentUserId: 'user-123'
            });

            const state = customStore.getState();
            expect(state.currentState).toBe(ConnectionState.SignedIn);
            expect(state.currentUserId).toBe('user-123');
        });

        it('should maintain independent state between instances', () => {
            const store1 = createConnectionStore();
            const store2 = createConnectionStore();

            store1.getState().setCurrentServerId('server-1');
            store2.getState().setCurrentServerId('server-2');

            expect(store1.getState().currentServerId).toBe('server-1');
            expect(store2.getState().currentServerId).toBe('server-2');
        });

        it('should support all operations', () => {
            const store = createConnectionStore();

            store.getState().setCurrentState(ConnectionState.SignedIn);
            store.getState().setWebSocketState('connected');
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            const state = store.getState();
            expect(state.currentState).toBe(ConnectionState.SignedIn);
            expect(state.webSocketState).toBe('connected');
            expect(state.connectionAttempts).toHaveLength(1);
        });
    });

    describe('complex scenarios', () => {
        it('should handle connection lifecycle', () => {
            useConnectionStore.getState().setCurrentState(ConnectionState.ServerSelection);
            useConnectionStore.getState().setAvailableServers([
                { Id: 'srv1', Name: 'Server 1', Address: 'http://localhost' }
            ] as any);

            useConnectionStore.getState().setCurrentState(ConnectionState.SignedIn);
            useConnectionStore.getState().setCurrentServerId('srv1');
            useConnectionStore.getState().setCurrentUserId('user-123');
            useConnectionStore.getState().setWebSocketState('connecting');

            const connectTime = Date.now();
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'srv1',
                serverName: 'Server 1',
                timestamp: connectTime,
                duration: 150,
                result: 'success'
            });

            useConnectionStore.getState().setWebSocketState('connected');

            const state = useConnectionStore.getState();
            expect(state.currentState).toBe(ConnectionState.SignedIn);
            expect(state.currentServerId).toBe('srv1');
            expect(state.currentUserId).toBe('user-123');
            expect(state.webSocketState).toBe('connected');
            expect(state.metrics.successfulAttempts).toBe(1);
        });

        it('should track multiple connection failures and recovery', () => {
            // Multiple failures
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'srv1',
                serverName: 'Server 1',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Timeout'
            });

            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'srv1',
                serverName: 'Server 1',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Network unreachable'
            });

            // Recovery
            useConnectionStore.getState().addConnectionAttempt({
                serverId: 'srv1',
                serverName: 'Server 1',
                timestamp: Date.now(),
                duration: 200,
                result: 'success'
            });

            const state = useConnectionStore.getState();
            expect(state.metrics.totalAttempts).toBe(3);
            expect(state.metrics.failedAttempts).toBe(2);
            expect(state.metrics.successfulAttempts).toBe(1);
            expect(state.metrics.lastConnectionTime).toBe(200);
        });
    });
});
