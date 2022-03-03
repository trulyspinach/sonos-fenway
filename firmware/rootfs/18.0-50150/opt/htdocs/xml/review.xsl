<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
<html>
<head>
<style type="text/css">
a { text-decoration: none; }
a:hover { text-decoration: underline; }
h1 { 
    font-family: arial, helvetica, sans-serif; 
    font-size: 18pt; 
    font-weight: bold;
}
h2 { 
    font-family: arial, helvetica, sans-serif; 
    font-size: 14pt; 
    font-weight: bold;
}
body, td { 
    font-family: arial, helvetica, sans-serif; 
    font-size: 10pt; 
}
th { 
    font-family: arial, helvetica, sans-serif; 
    font-size: 11pt; 
    font-weight: bold; 
}
table.purple {
border: 1px;
cellpadding: 3px;
cellspacing: 1px;
width: 600px;
background: #000000;
margin-bottom: 20px;
}
table.purple tr {
background: #cccccc;
}
table.purple tr.header {
background: #9999cc;
}
table.purple td.left {
font-weight: bold;
background: #ccccff;
width: 300px;
}
.l1 { }
.l2 { margin-left: 10pt}
#networkTable {table-collapse:collapse; border-spacing:0}
#networkTable td {border:2px groove black; padding:7px}
#networkTable th {border:2px groove black; padding:7px}
.ctr {text-align:center}
</style>
<title>Sonos Support Info</title>
<script language="JavaScript">
<![CDATA[
function toggle(id) { 
    var whichEl = document.getElementById(id);
    whichEl.style.display = (whichEl.style.display == "none" ) ? "" : "none";
}
]]>
</script>
<script src="/review.js" type="text/javascript"></script>
</head>
<body>
<xsl:apply-templates select="ZPNetworkInfo/Timestamp"/>
<!-- Handles the case for a single zoneplayer packet -->
<xsl:apply-templates select="ZPSupportInfo"/>
<!-- Handles the case for aggregated zoneplayer packet -->
<xsl:apply-templates select="ZPNetworkInfo/ZPSupportInfo"/>
<!-- Handles the controllers in both cases -->
<xsl:apply-templates select="//Controllers/ZPSupportInfo"/>
<!-- Network matrix -->
<xsl:call-template name="NetworkMatrix"/>
</body>
</html>
</xsl:template>

<xsl:template match="Timestamp">
<p>Support Data Collected <xsl:value-of select="."/></p>
</xsl:template>

<xsl:template match="ZPSupportInfo">
<xsl:if test="count(*) > 1 and count(ZPInfo) > 0">
<br/><a>
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
<xsl:value-of select="ZPInfo/ZoneName"/> (<xsl:value-of select="ZPInfo/LocalUID"/>)
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(*) > 1 and count(ZPInfo) > 0">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<xsl:apply-templates select="ZPInfo"/>
<xsl:apply-templates select="ControllerInfo"/>
<xsl:apply-templates select="ZonePlayers"/>
<xsl:apply-templates select="MediaServers"/>
<xsl:apply-templates select="TrackSummary"/>
<xsl:apply-templates select="TrackQueueSummary"/>
<xsl:apply-templates select="Subscriptions/Incoming"/>
<xsl:apply-templates select="Subscriptions/Outgoing"/>
<xsl:apply-templates select="Shares"/>
<xsl:apply-templates select="Alarm"/>
<xsl:apply-templates select="Playmode"/>
<xsl:apply-templates select="EnetPorts"/>
<xsl:apply-templates select="RadioStationLog"/>
<xsl:apply-templates select="File"/>
<xsl:apply-templates select="Command"/>
<xsl:apply-templates select="Titles"/>
</div>
</xsl:template>

<xsl:template match="Controllers/ZPSupportInfo">
<xsl:if test="count(*) > 1">
<br/><a>
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Controller
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<xsl:apply-templates select="ControllerInfo"/>
<xsl:apply-templates select="ZonePlayers"/>
<xsl:apply-templates select="MediaServers"/>
<xsl:apply-templates select="TrackSummary"/>
<xsl:apply-templates select="Subscriptions/Incoming"/>
<xsl:apply-templates select="Subscriptions/Outgoing"/>
<xsl:apply-templates select="File"/>
<xsl:apply-templates select="Command"/>
</div>
</xsl:template>

<xsl:template match="TrackSummary">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Track Summary
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table cols="6">
<tr><th>&#160;</th><th>Title</th></tr>
<tr>
<td>MAX</td>
<xsl:for-each select=".//Table">
    <td><xsl:value-of select="@max"/></td>
</xsl:for-each>
</tr>
<tr>
<td>COUNT</td>
<xsl:for-each select=".//Table">
    <td><xsl:value-of select="@count"/></td>
</xsl:for-each>
</tr>
<tr><td>Store Size</td><td align="right"><xsl:value-of select="StoreSize"/></td></tr>
<tr><td>Store Used</td><td align="right"><xsl:value-of select="StoreUsed"/></td></tr>
<tr><td>Entries Size</td><td align="right"><xsl:value-of select="EntriesSize"/></td></tr>
<tr><td>Entries Used</td><td align="right"><xsl:value-of select="EntriesUsed"/></td></tr>
<tr><td>Conflicts</td><td align="right"><xsl:value-of select="Conflicts"/></td></tr>
</table>
</div>
</xsl:template>

<xsl:template match="Titles">
<H3>Tracks</H3>
<table cols="8">
<tr><th>File</th><th>Leaf</th><th>Title</th><th>Album</th><th>Artist</th><th>Composer</th><th>Genre</th><th>Sort Key</th></tr>
<xsl:for-each select=".//Title">
<tr>
<td><xsl:value-of select="File"/></td>
<td><xsl:value-of select="Leaf"/></td>
<td><xsl:value-of select="Description"/></td>
<td><xsl:value-of select="Album"/></td>
<td><xsl:value-of select="Artist"/></td>
<td><xsl:value-of select="Composer"/></td>
<td><xsl:value-of select="Genre"/></td>
<td><xsl:value-of select="@track"/></td>
</tr>
</xsl:for-each>
</table>
</xsl:template>

<xsl:template match="Environment">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Environment
</a> 
</xsl:if>
<div id="{generate-id()}">
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">
<tr valign="middle" bgcolor="#9999cc">
<th>Variable</th><th>Value</th>
</tr>
<xsl:for-each select=".//Variable">
<tr valign="baseline" bgcolor="#cccccc">
<td bgcolor="#ccccff"><b><xsl:value-of select="@name"/></b></td>
<td align="left"><xsl:value-of select="."/></td>
</tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="File">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
<xsl:value-of select="@name"/>
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">
<tr valign="top" bgcolor="#cccccc">
<td align="left"><pre>contents of <xsl:value-of select="@name"/>
<br/><xsl:value-of select="."/></pre></td>
</tr>
</table>
</div>
</xsl:template>

<xsl:template match="Command">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
<xsl:value-of select="@cmdline"/>
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">
<tr valign="top" bgcolor="#cccccc">
<td align="left"><pre>running <xsl:value-of select="@cmdline"/>
<br/>
<xsl:value-of select="."/></pre></td>
</tr>
</table>
</div>
</xsl:template>

<xsl:template match="ZPInfo">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Zone Player Info
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table class="purple" align="center">
<xsl:for-each select=".//*">
<tr><td class="left"><xsl:value-of select="local-name()"/></td><td><xsl:apply-templates select="current()/text()"/></td></tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="ControllerInfo">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Controller Info
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table class="purple" align="center">
<xsl:for-each select=".//*">
<tr><td class="left"><xsl:value-of select="local-name()"/></td><td><xsl:apply-templates select="current()/text()"/></td></tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="ZonePlayers">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Zone Players
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table cellpadding="4">
<tr><th>Zone Name</th><th>Coordinator</th><th>Group</th><th>Location</th><th>UUID</th><th>Version</th><th>MinCompatVer</th><th>Compat</th></tr>
<xsl:for-each select=".//ZonePlayer">
<tr>
    <td><xsl:value-of select="."/></td>
    <td><xsl:value-of select="@coordinator"/></td>
    <td><xsl:value-of select="@group"/></td>
    <td><xsl:value-of select="@location"/></td>
    <td><xsl:value-of select="@uuid"/>      </td>
    <td><xsl:value-of select="@version"/>   </td>
    <td><xsl:value-of select="@mincompatibleversion"/>   </td>
    <td><xsl:value-of select="@compatible"/></td>
</tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="MediaServers">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Media Servers
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table cellpadding="4">
<tr><th>Name</th><th>Location</th><th>UUID</th><th>Version</th><th>CanBeDisplayed</th><th>Unavailable</th><th>Type</th><th>Ext</th></tr>
<xsl:for-each select=".//MediaServer">
<tr>
    <td><xsl:value-of select="."/></td>
    <td><xsl:value-of select="@location"/></td>
    <td><xsl:value-of select="@uuid"/>      </td>
    <td><xsl:value-of select="@version"/>   </td>
    <td><xsl:value-of select="@canbedisplayed"/></td>
    <td><xsl:value-of select="@unavailable"/></td>
    <td><xsl:value-of select="@type"/></td>
    <td><xsl:value-of select="@ext"/></td>
</tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="Subscriptions/Incoming">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Incoming Subscriptions
</a> 
<div id="{generate-id()}">
<xsl:attribute name="style">display:none</xsl:attribute>
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">
<tr valign="top" bgcolor="#cccccc">
<td align="left">
<pre>
<xsl:for-each select=".//Service">
subscriptions for: <xsl:value-of select="@name"/> current: <xsl:value-of select="@current"/> max: <xsl:value-of select="@max"/>
<xsl:for-each select=".//Subscription">
<br/><xsl:text>	</xsl:text>
<xsl:value-of select="./EventKey"/>
<xsl:text>	</xsl:text>
<xsl:value-of select="./NotifyErrors"/>
<xsl:text>	</xsl:text>
<xsl:value-of select="./SubscriptionID"/>
<xsl:text>	</xsl:text>
<xsl:value-of select="./NotificationAddr"/>
</xsl:for-each>
</xsl:for-each>
</pre>
</td>
</tr>
</table>
</div>
</xsl:template>

<xsl:template match="Subscriptions/Outgoing">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Outgoing Subscriptions
</a> 
<div id="{generate-id()}">
<xsl:attribute name="style">display:none</xsl:attribute>
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">
<tr valign="top" bgcolor="#cccccc">
<td align="left"><pre>
Outgoing Subscriptions<xsl:for-each select=".//Subscription">
<br/><xsl:text>	</xsl:text>
<xsl:value-of select="./LogicalSID"/>
<xsl:text>	</xsl:text>
<xsl:value-of select="./UPnPSID"/>
<xsl:text>	</xsl:text>
<xsl:value-of select="./ControlURI"/>
</xsl:for-each>
</pre>
</td>
</tr>
</table>
</div>
</xsl:template>

<xsl:template match="Shares">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Shares
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">
<tr valign="middle" bgcolor="#9999cc">
<th>Share Path</th>
<th>Bytes Used</th>
</tr>
<xsl:for-each select=".//Share">
<tr valign="baseline" bgcolor="#cccccc">
<td bgcolor="#ccccff"><b><xsl:value-of select="Path"/></b></td>
<td bgcolor="#ccccff" align="right"><b><xsl:value-of select="Bytes"/></b></td>
</tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="Playmode">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Play Mode
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table class="purple" align="center">
<xsl:for-each select=".//*">
<tr><td class="left"><xsl:value-of select="local-name()"/></td><td><xsl:apply-templates select="current()/text()"/></td></tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="Alarm">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Alarm Data
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table border="0" cellpadding="3" cellspacing="1" width="600" bgcolor="#000000" align="center">

<tr valign="baseline" bgcolor="#cccccc">
<td bgcolor="#ccccff"><b>Time Mode</b></td>
<td align="left"><xsl:value-of select="Mode"/></td>
</tr>

<tr valign="baseline" bgcolor="#cccccc">
<td bgcolor="#ccccff"><b>Stamp</b></td>
<td align="left"><xsl:value-of select="Stamp"/></td>
</tr>

<tr valign="baseline" bgcolor="#cccccc">
<td bgcolor="#ccccff"><b>UTC Time</b></td>
<td align="left"><xsl:value-of select="UTCTime"/></td>
</tr>

<tr valign="baseline" bgcolor="#cccccc">
<td bgcolor="#ccccff"><b>Local Time</b></td>
<td align="left"><xsl:value-of select="LocalTime"/></td>
</tr>

</table>

<p>Pending Alarm Data</p>

<table cellpadding="4">
<tr><th>ID</th><th>Time</th><th>Recurrence</th><th>NextUTC</th><th>NextLocal</th></tr>
<xsl:for-each select="./Pending/PendingAlarm">
<tr><td><xsl:value-of select="ID"/></td><td><xsl:value-of select="Time"/></td><td><xsl:value-of select="Recurrence"/></td><td><xsl:value-of select="NextUTC"/></td><td><xsl:value-of select="NextLocal"/></td></tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template name="NetworkMatrix">
<xsl:if test="count(/*//ZPSupportInfo) > 1">
<br/><a>
<xsl:attribute name="href">javascript:makenetwork(); toggle('network');</xsl:attribute>
Network Matrix
</a> 
<div id="network" style="display:none">
<table align="center" id="networkTable">
<tbody id="networkTableBody">
</tbody>
</table>

<form style="display:none" id="netdata" name="netdata">
<xsl:for-each select="/ZPNetworkInfo/ZPSupportInfo/File[@name = '/proc/ath_rincon/status']">
<div>
<xsl:attribute name="id">netdata_<xsl:value-of select="..//LocalUID"/></xsl:attribute>
<textarea>
<xsl:attribute name="id">status_<xsl:value-of select="..//LocalUID"/></xsl:attribute>
<xsl:value-of select="."/>
</textarea>
<textarea>
<xsl:attribute name="id">ifconfig_<xsl:value-of select="..//LocalUID"/></xsl:attribute>
<xsl:value-of select="../Command[@cmdline = '/sbin/ifconfig']"/>
</textarea>
<textarea>
<xsl:attribute name="id">stp_<xsl:value-of select="..//LocalUID"/></xsl:attribute>
<xsl:value-of select="../Command[@cmdline = '/usr/sbin/brctl showstp br0']"/>
</textarea>
<textarea>
<xsl:attribute name="id">zonename_<xsl:value-of select="..//LocalUID"/></xsl:attribute>
<xsl:value-of select="..//ZoneName"/>
</textarea>
</div>
</xsl:for-each>
</form>

</div>
</xsl:if>
</xsl:template>

<xsl:template match="EnetPorts">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Ethernet Ports
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table cols="3">
<tr><th>Port</th><th>Link</th><th>Speed</th></tr>
<xsl:for-each select=".//Port">
<tr>
<td><xsl:value-of select="@port"/></td>
<td><xsl:value-of select="Link"/></td>
<td><xsl:value-of select="Speed"/></td>
</tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="RadioStationLog">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Radio Station Log
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<table cols="3">
<tr><th>Timestamp</th><th>Type</th><th>URI</th></tr>
<xsl:for-each select=".//Entry">
<tr>
<td><xsl:value-of select="TimeStamp"/></td>
<td><xsl:value-of select="Meta"/></td>
<td><xsl:value-of select="URI"/></td>
</tr>
</xsl:for-each>
</table>
</div>
</xsl:template>

<xsl:template match="TrackQueueSummary">
<xsl:if test="count(../*) > 1">
<br/><a class="l2">
<xsl:attribute name="href">javascript:toggle('<xsl:value-of select="generate-id()"/>')</xsl:attribute>
Track Queue Summary
</a> 
</xsl:if>
<div id="{generate-id()}">
<xsl:if test="count(../*) > 1">
<xsl:attribute name="style">display:none</xsl:attribute>
</xsl:if>
<xsl:for-each select=".//Queue">
<table cols="2" align="center" class="purple">
<tr class="header"><th colspan="2"><xsl:value-of select="@Name"/></th></tr>
<xsl:for-each select=".//*">
<tr><td class="left"><xsl:value-of select="local-name()"/></td><td><xsl:apply-templates select="current()/text()"/></td></tr>
</xsl:for-each>
</table>
</xsl:for-each>
</div>
</xsl:template>

</xsl:stylesheet>
