---
title: "Creating/Modifying Search Topology on SharePoint 2016"
comments: false
description: "Creating/Modifying Search Topology on SharePoint 2016"
keywords: "sharepoint, 2016, search, topology, create, modify, multiple, search, servers"
---

| Hostname | Role        | Components                                                              |
|----------|-------------|-------------------------------------------------------------------------|
| App1     | Application | Admin, Crawl, Content Processing, Indexing, Query Processing, Analytics |
| App2     | Application | Admin, Crawl, Content Processing, Indexing, Query Processing, Analytics |
| Web1     | Web Front   | Indexing, Query Processing                                              |
| Web2     | Web Front   | Indexing, Query Processing                                              |

### A. Configuring a new Search Topology

1. Create a new Search application `Search Service Application` with database name `SharePoint_Search`; 
```
$ssa = New-SPEnterpriseSearchServiceApplication -Name "Search Service Application" -DatabaseName "SharePoint_Search" -ApplicationPool "Search Service AppPool" -AdminApplicationPool "Search Service AdminAppPool"
```

2. Create a new proxy for Search application `Search Service Application Proxy`; 
```
New-SPEnterpriseSearchServiceApplicationProxy -Name "Search Service Application Proxy" -SearchApplication $ssa
```

3. Save the Search Service Application into a variable;
```
$ssa = Get-SPEnterpriseSearchServiceApplication
```

4. Define variables (hostA, hostB...) for each servers that will be included in the Search topology;
```
$hostA = Get-SPEnterpriseSearchServiceInstance | ?{$_.Server -match "App1"}
$hostB = Get-SPEnterpriseSearchServiceInstance | ?{$_.Server -match "App2"}
$hostC = Get-SPEnterpriseSearchServiceInstance | ?{$_.Server -match “Web1"}
$hostD = Get-SPEnterpriseSearchServiceInstance | ?{$_.Server -match "Web2"}
```

5. Start Search Service in all the servers that will be included in the Search topology;
```
Start-SPEnterpriseSearchServiceInstance -Identity $hostA
Start-SPEnterpriseSearchServiceInstance -Identity $hostB
Start-SPEnterpriseSearchServiceInstance -Identity $hostC
Start-SPEnterpriseSearchServiceInstance -Identity $hostD
```

6. Verify that Search instance is running in all the servers;
```
Get-SPEnterpriseSearchServiceInstance -Identity $hostA
Get-SPEnterpriseSearchServiceInstance -Identity $hostB
Get-SPEnterpriseSearchServiceInstance -Identity $hostC
Get-SPEnterpriseSearchServiceInstance -Identity $hostD
```

7. Clone current active topology;
```
$clone = $sa.ActiveTopology.Clone()
```

8. Configure `App1` and `App2` to have Admin, Crawl, Content Processing, Indexing, Query Processing and Analytics;
```
New-SPEnterpriseSearchAdminComponent -SearchTopology $newTopology -SearchServiceInstance $hostA
New-SPEnterpriseSearchCrawlComponent -SearchTopology $newTopology -SearchServiceInstance $hostA
New-SPEnterpriseSearchContentProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostA
New-SPEnterpriseSearchAnalyticsProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostA
New-SPEnterpriseSearchQueryProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostA
New-SPEnterpriseSearchIndexComponent -SearchTopology $newTopology -SearchServiceInstance $hostA -IndexPartition 0
```
```
New-SPEnterpriseSearchAdminComponent -SearchTopology $newTopology -SearchServiceInstance $hostB
New-SPEnterpriseSearchCrawlComponent -SearchTopology $newTopology -SearchServiceInstance $hostB
New-SPEnterpriseSearchContentProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostB
New-SPEnterpriseSearchAnalyticsProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostB
New-SPEnterpriseSearchQueryProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostB
New-SPEnterpriseSearchIndexComponent -SearchTopology $newTopology -SearchServiceInstance $hostB -IndexPartition 0
```

9. Configure `Web1` and `Web2` to have Query Processing and Indexing;
```
New-SPEnterpriseSearchQueryProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostC
New-SPEnterpriseSearchIndexComponent -SearchTopology $newTopology -SearchServiceInstance $hostC -IndexPartition 0
```
```
New-SPEnterpriseSearchQueryProcessingComponent -SearchTopology $newTopology -SearchServiceInstance $hostD
New-SPEnterpriseSearchIndexComponent -SearchTopology $newTopology -SearchServiceInstance $hostD -IndexPartition 0
```

10. Activate clone topology;
```
$clone.Activate()
```

11. Go to `CA > General Application Settings > Farm Search Administration > Search Server Application`. All the servers will be listed under Search Application Topology.

12. Verify the topology;
```
Get-SPEnterpriseSearchTopology -SearchApplication $ssa
```  
This will print all the topologies including the inactive one.

13. Check the status of the index components;
```
Get-SPEnterpriseSearchStatus -SearchApplication $ssa -Text
```

14.	To remove inactive topologies, run the following command;
```
Get-SPEnterpriseSearchServiceApplication | Get-SPEnterpriseSearchTopology |? {$_.State -eq "Inactive"} |% { Remove-SPEnterpriseSearchTopology -Identity $_ -Confirm:$false}
```

___

### B. Modifying an existing Search Topology

1. Save active search topology into a variable;
```
$ssa = Get-SPEnterpriseSearchServiceApplication
$active = Get-SPEnterpriseSearchTopology -SearchApplication $ssa -Active
```

2. Clone the active topology;
```
$clone = New-SPEnterpriseSearchTopology -SearchApplication $ssa -Clone -SearchTopology $active
```

3. Wait for indexes to be replicated and then we can remove old index component from the clone topology. To remove old index, we need to find `ComponentId`. Run the following command to find `ComponentId` of the server under the clone topology;
```
Get-SPEnterpriseSearchComponent -SearchTopology $clone
```  
For example, App2 will have an index with ComponentId, `c8309775-dcf3-4a07-8598-05dbc98b04b0`.

4. Run the following command to remove the index from the server;
```
Remove-SPEnterpriseSearchComponent -Identity 'c8309775-dcf3-4a07-8598-05dbc98b04b0' -SearchTopology $clone
```

5. Activate the new cloned topology;
```
$clone.Activate()
```

6. To remove inactive topologies, run the following command;
```
Get-SPEnterpriseSearchServiceApplication | Get-SPEnterpriseSearchTopology |? {$_.State -eq "Inactive"} |% { Remove-SPEnterpriseSearchTopology -Identity $_ -Confirm:$false}
```

___

**Changing Index path**

Default index location is at `C:\Program Files\Microsoft Office Servers\16.0\Data\Office Server\Applications` which may create issue since it's reading/writing to a slow I/O hard disk. To change the location and move it to a flash drive, run the following command;
```
New-SPEnterpriseSearchIndexComponent -SearchTopology $clone -SearchServiceInstance $ssa -IndexPartition 0 -RootDirectory Z:\FlashDrive\Index\0
```
We need to run this command before activing the topology.

