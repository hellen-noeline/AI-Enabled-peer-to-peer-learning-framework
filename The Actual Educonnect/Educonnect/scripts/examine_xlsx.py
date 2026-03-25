import pandas as pd
import sys

file_path = r"c:\Users\RONALD TUSIIME KIGAM\Desktop\The Actual Educonnect (2)\students_expanded_UCU.xlsx"

try:
    df = pd.read_excel(file_path)
    print("Columns in UCU Excel Dataset:")
    print(df.columns.tolist())
    print("\nFirst 2 rows:")
    print(df.head(2).to_dict('records'))
except Exception as e:
    print(f"Error reading file: {e}")
    sys.exit(1)
