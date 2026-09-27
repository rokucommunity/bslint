sub checkTypesNoProblem(param as string) ' no diagnostic
    param = "Hello " + param
    num = 1234
    num = 6.7
    bool = true
    if num > 3
        bool = false
    end if
end sub

sub checkTypesChangeFromParam(param as string)
    param = 1 ' was string. now integer
end sub


sub checkTypesInFunc()
    value = 1
    value = "hello" ' was string. now integer
end sub

function getDynamic()
    return 1
end function

sub checkTypesDefinedToDynamic()
    value = 1
    value = getDynamic() ' was integer. now dynamic
end sub

sub checkTypesNumberChange() ' no diagnostic
    param = 1
    param = 3.14
end sub


sub checkTypesDynamicToDefined() ' no diagnostic
    value = getDynamic()
    value = 1 ' was dynamic. now integer
end sub

sub checkTypesObject(obj as object)
    if obj = invalid
        obj = createObject("roAssociativeArray")
    end if
    obj.foo = "bar"
end sub

sub checkTypesObjectToPrimitive(obj as object)
    obj = 3 ' This is allowed because primitive types can be boxed as objects
end sub

sub checkTypesPrimitiveToObject(obj as integer)
    obj = createObject("roAssociativeArray") ' was integer. now associativearray
end sub
