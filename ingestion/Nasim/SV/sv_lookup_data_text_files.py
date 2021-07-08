import pandas as pd


def main():
    layouts_path = "/Users/NTavakol/Desktop/SVData/Carvana-20210624/layouts/2021 NVES-QuestionsCarvana.csv"
    rawfaile_p1_path = "/Users/NTavakol/Desktop/SVData/Carvana-20210624/raw_feeds/NVES-2021-20210624-part1.txt"
    rawfaile_test_path = "/Users/NTavakol/Desktop/SVData/Carvana-20210624/raw_feeds/NVES-test-part1.txt"
    

    df_layouts = pd.read_csv(layouts_path)
    
    raw_p1_files = open(rawfaile_test_path,'r')
    raw_p1_lines = raw_p1_files.readlines()

    df_layouts = df_layouts.sort_values("Position")
    df_layouts_filtered = df_layouts.where(~df_layouts["Position"].isin([1]))
    df_layouts_filtered = df_layouts_filtered.dropna(subset=["Position"])
    # df_layouts_filtered = df_layouts.where(df_layouts["Position"]>= 9).dropna(subset=["Position"])
    df_layouts_filtered["position_int"] = df_layouts_filtered["Position"].astype(int) -1
    df_layouts_filtered["length_int"] = df_layouts_filtered["Length"].astype(int)
    df_layouts_filtered.loc[df_layouts_filtered["Name"].isna(), 'field_name'] = df_layouts_filtered["Question Code"]
    df_layouts_filtered.loc[df_layouts_filtered["Name"].notna(), 'field_name'] = df_layouts_filtered["Name"]
    # df_layouts = df_layouts.sort_values("Position")
    # df_layouts_filtered = df_layouts_filtered.where(df_layouts_filtered["Position"].isna())

    # for index,row in df_layouts_filtered.iterrows():
    #     position = row["position_int"]
    #     length = row["Length"]
    #     name = row["Name"]
    #     q_code = row["Question Code"]
    #     field_name = name if name is not None else q_code
    #     for line in raw_p1_lines:
    #         l_row=[]
    #         seq = line[0:8]
    #         l_row.append(seq)  
    
    results = {'seq_number':[]}
    for index,row in df_layouts_filtered.iterrows():
        fld_name = row["field_name"]
        results[fld_name]=[]
        

    for line in raw_p1_lines:
        # l_row=[]
        seq = line[0:8]
        results["seq_number"].append(seq)
        for index,row in df_layouts_filtered.iterrows():
            position = row["position_int"]
            length = row["length_int"]
            field_name = row["field_name"]
            field = line[position:position+length]     
            results[field_name].append(field)
        # l_result.extend(l_row)

    df_results = pd.DataFrame(results)
    df_results.to_csv("/Users/NTavakol/carv_document_Nasim/SV_Reviews/sv_raw_data.csv")

    print(df_results)
    
    

if __name__ == '__main__':
	main()