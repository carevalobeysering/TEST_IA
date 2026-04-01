SELECT
    @@SERVERNAME AS server_name,
    DB_NAME() AS current_database,
    SYSTEM_USER AS system_user,
    ORIGINAL_LOGIN() AS original_login,
    CAST(SERVERPROPERTY('MachineName') AS NVARCHAR(128)) AS machine_name,
    CAST(SERVERPROPERTY('ServerName') AS NVARCHAR(128)) AS server_property_name,
    CAST(SERVERPROPERTY('InstanceName') AS NVARCHAR(128)) AS instance_name,
    CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128)) AS edition,
    CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(128)) AS product_version;

SELECT
    DB_NAME(database_id) AS database_name,
    state_desc,
    recovery_model_desc,
    user_access_desc
FROM sys.databases
WHERE name = N'Farmacia';

SELECT
    name,
    type_desc,
    create_date,
    modify_date
FROM sys.tables
WHERE name IN (N'Patient', N'Purchase', N'ProgramStatus', N'DiscountConfiguration')
ORDER BY name;

SELECT
    t.name AS table_name,
    c.name AS column_name,
    ty.name AS data_type,
    c.max_length,
    c.is_nullable
FROM sys.columns c
JOIN sys.tables t ON t.object_id = c.object_id
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE t.name IN (N'Patient', N'Purchase', N'ProgramStatus', N'DiscountConfiguration')
  AND c.name IN (N'id', N'patientId', N'uniqueIdentifier')
ORDER BY t.name, c.column_id;

SELECT
    i.name AS index_name,
    t.name AS table_name,
    i.type_desc,
    i.is_primary_key,
    i.is_unique,
    STRING_AGG(CONCAT(c.name, CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END), ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS key_columns
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE t.name IN (N'Patient', N'Purchase', N'ProgramStatus', N'DiscountConfiguration')
  AND i.name IS NOT NULL
GROUP BY i.name, t.name, i.type_desc, i.is_primary_key, i.is_unique
ORDER BY t.name, i.name;

SELECT N'Patient' AS table_name, COUNT(*) AS row_count FROM dbo.Patient
UNION ALL
SELECT N'Purchase' AS table_name, COUNT(*) AS row_count FROM dbo.Purchase
UNION ALL
SELECT N'ProgramStatus' AS table_name, COUNT(*) AS row_count FROM dbo.ProgramStatus
UNION ALL
SELECT N'DiscountConfiguration' AS table_name, COUNT(*) AS row_count FROM dbo.DiscountConfiguration;

SELECT
    session_id,
    net_transport,
    protocol_type,
    auth_scheme,
    encrypt_option,
    client_net_address,
    local_net_address,
    local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;