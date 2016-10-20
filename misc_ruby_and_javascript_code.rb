require 'csv'
require 'json'

my_file = 'ecolm.csv'
csv_file = CSV.read(my_file)

csv_file[1][0].length

tab1 = csv_file[1][0]
tab1.gsub(/\r\n/," ")

tab1.to_s # NEEDED ???

csv_file.each {|x| puts x[0].length}

json_file = csv_file.to_json ; nil

# from stackoverflow.com
json_file = CSV.open(my_file, :headers => true).map { |x| x.to_h }.to_json

File.open("temp.json","w") do |f|
  f.write(json_file.to_json)
end

json_file = csv_file.map {|x| puts x[0].gsub(/\r\n/," ".to_h )}.to_json ; nil

# didn't work, all nils
json_file = csv_file.map {|x| puts x[0].gsub(/\r\n/," " )}.to_json ; nil

csv_file_wo_returns = csv_file.map {|x| x[0].gsub(/\r\n/," " )} ; nil
h1 = {"1" => csv_file_wo_returns[7]}

# convert array to json from stackoverflow
array.collect { |item| {:id => item.id, :car => item.car} }.to_json
json_file = csv_file_wo_returns.collect { |item| {:ident => "tabcode", :tabcode => item[0]} }.to_json ; nil
# small version
json_file = csv_file_wo_returns[1..100].collect { |item| {:ident => "tabcode", :tabcode => item} }.to_json ; nil

# now for some JAVASCRIPT

# does NOT work in chrome
$.getJSON("js/temp.json", function(json) {
    console.log(json); // this will show the info it in firebug console
});

var tab_db = "...json string.."
var obj = JSON.parse(tab_db);
obj.length # = 10
obj[0]["tabcode"]

#Note from David Lewis about "breaks" variable:
#It might be the 'breaks' variable. It's set up with the expectation of indicating different ways 
#of 'justifying' the music, but also, for the OCR correction interface, of only showing a single system. 
#If breaks="stop" (in base.js), I think it will stop rendering at the first break. 
#False means display everything on one system, True means apply all explicit breaks, 
#and I think a width in pixels may trigger automatic system breaking 
#(if I got around to implementing that).