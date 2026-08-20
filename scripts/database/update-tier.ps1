$connectionString = "Server=localhost\SQLEXPRESS;Database=GatherGroveDb_Dev;Integrated Security=true;TrustServerCertificate=true"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$connection.Open()

$command = $connection.CreateCommand()
$command.CommandText = "UPDATE Clubs SET Tier = 'Grow' WHERE Id = 4"
$command.ExecuteNonQuery()

$command.CommandText = "SELECT Id, Name, Tier FROM Clubs WHERE Id = 4"
$reader = $command.ExecuteReader()
while ($reader.Read()) {
    Write-Host "Club ID: $($reader['Id']), Name: $($reader['Name']), Tier: $($reader['Tier'])"
}
$reader.Close()
$connection.Close()
Write-Host "Tier updated successfully!"
